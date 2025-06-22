<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Skaccount;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SkAuthController extends Controller
{
    /**
     * Email verification service
     * 
     * @var EmailVerificationService
     */
    protected $verificationService;
    
    /**
     * Constructor
     */
    public function __construct(EmailVerificationService $verificationService)
    {
        $this->verificationService = $verificationService;
    }

    /**
     * Handle SK login requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Find the SK account by email
        $skAccount = Skaccount::where('email', $credentials['email'])->first();
        
        // Check if account exists and credentials are correct
        if ($skAccount && Hash::check($credentials['password'], $skAccount->password)) {
            // Check if account is eligible (not expired term or over age)
            $eligibilityIssues = [];
            
            if ($skAccount->isTermExpired()) {
                $eligibilityIssues[] = 'Your term has expired on ' . 
                    $skAccount->term_end->format('F d, Y') . '.';
            }
            
            if ($skAccount->isOverAge()) {
                $eligibilityIssues[] = 'You are no longer eligible for SK due to age restrictions (must be under 25).';
            }
            
            if ($skAccount->terms_served > 3) {
                $eligibilityIssues[] = 'You have reached the maximum number of terms allowed (3 consecutive terms).';
            }
            
            // If there are eligibility issues, return them
            if (!empty($eligibilityIssues) && $skAccount->sk_role !== 'Admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Account eligibility issue',
                    'eligibility_issues' => $eligibilityIssues,
                    'email' => $credentials['email']
                ], 403);
            }
            
            // Check verification status
            $isVerified = $skAccount->verification_status === 'verified';
            
            // Check authentication status
            $isAuthenticated = $skAccount->authentication_status === 'active';
            
            // If both verified and authenticated, initiate 2FA
            if ($isVerified && $isAuthenticated) {
                // Generate 2FA code
                $code = $this->verificationService->generateOtp($skAccount->email, 'sk_2fa');
                
                // Send 2FA code
                $this->verificationService->sendOtpEmail($skAccount->email, $skAccount->first_name, $code, 'verification');
                
                // Return response indicating 2FA is needed
                return response()->json([
                    'success' => true,
                    'needs2FA' => true,
                    'message' => 'Please verify your identity using the 2FA code sent to your email.',
                    'email' => $credentials['email']
                ]);
            }
            
            // If not verified, send OTP
            if (!$isVerified) {
                $code = $this->verificationService->generateOtp($skAccount->email, 'sk');
                $this->verificationService->sendOtpEmail($skAccount->email, $skAccount->first_name, $code);
            }
            
            // Return statuses
            return response()->json([
                'success' => false,
                'verified' => $isVerified,
                'authenticated' => $isAuthenticated,
                'message' => $isVerified ? 
                    'Your account is pending authentication by an administrator.' : 
                    'Please verify your email before logging in. A verification code has been sent.',
                'email' => $credentials['email']
            ], 403);
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    /**
     * Handle SK registration requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        try {
            // First, check if the storage link exists
            if (!file_exists(public_path('storage'))) {
                // Try to create the storage link
                Artisan::call('storage:link');
            }
            
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'last_name' => 'required|string|max:255',
                'gender' => 'required|in:male,female',
                'birthdate' => 'required|date',
                'age' => 'required|integer|min:15|max:24',
                'email' => 'required|string|email|max:255|unique:skaccounts',
                'house_number' => 'nullable|string|max:255',
                'street' => 'required|string|max:255',
                'subdivision' => 'nullable|string|max:255',
                'city' => 'required|string|max:255',
                'province' => 'required|string|max:255',
                'phone_number' => 'required|string|max:255',
                'sk_station' => 'required|in:Dela Paz,Manggahan,Maybunga,Pinagbuhatan,Rosario,San Miguel,Santa Lucia,Santolan',
                'sk_role' => 'required|in:Federasyon,Chairman,Kagawad',
                'term_start' => 'required|date',
                'term_end' => 'required|date|after:term_start',
                'terms_served' => 'required|integer|min:1|max:3',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'valid_id' => 'required|file|mimes:jpeg,png,jpg,pdf|max:2048',
            ]);

            // Validate age range (15-24)
            $birthdate = Carbon::parse($validated['birthdate']);
            $age = $birthdate->age;
            if ($age < 15 || $age >= 25) {
                return response()->json([
                    'success' => false,
                    'errors' => ['age' => ['SK members must be between 15 and 24 years old.']]
                ], 422);
            }
            
            // Validate term dates
            $termStart = Carbon::parse($validated['term_start']);
            $termEnd = Carbon::parse($validated['term_end']);
            
            if ($termEnd->diffInYears($termStart) > 3) {
                return response()->json([
                    'success' => false,
                    'errors' => ['term_end' => ['SK term cannot exceed 3 years.']]
                ], 422);
            }
            
            if ($termStart->isPast() && $termEnd->isPast()) {
                return response()->json([
                    'success' => false,
                    'errors' => ['term_end' => ['Term has already ended. Please provide a current or future term.']]
                ], 422);
            }

            // Handle file upload
            $validIdPath = null;
            if ($request->hasFile('valid_id')) {
                // Store the file
                $validIdPath = $request->file('valid_id')->store('valid_ids', 'public');
                
                // Verify that the file was stored correctly
                if (!Storage::disk('public')->exists($validIdPath)) {
                    return response()->json([
                        'success' => false,
                        'errors' => ['valid_id' => ['Failed to store the oath document. Please try again.']]
                    ], 422);
                }
                
                // Double check if the file is accessible via the public URL
                $publicPath = public_path('storage/' . $validIdPath);
                if (!file_exists($publicPath)) {
                    // The storage link might be broken, try to recreate it
                    Artisan::call('storage:link');
                    
                    // If still not accessible, log the issue
                    if (!file_exists($publicPath)) {
                        Log::warning('Storage link issue detected. File stored at: ' . $validIdPath . ' but not accessible at: ' . $publicPath);
                    }
                }
            } else {
                return response()->json([
                    'success' => false,
                    'errors' => ['valid_id' => ['Please upload your oath document']]
                ], 422);
            }

            $user = Skaccount::create([
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'gender' => $request->gender,
                'birthdate' => $request->birthdate,
                'age' => $request->age,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'house_number' => $request->house_number,
                'street' => $request->street,
                'subdivision' => $request->subdivision,
                'city' => $request->city ?: 'Pasig',
                'province' => $request->province ?: 'Metro Manila',
                'sk_station' => $request->sk_station,
                'sk_role' => $request->sk_role,
                'term_start' => $request->term_start,
                'term_end' => $request->term_end, 
                'terms_served' => $request->terms_served,
                'verification_status' => 'not_verified',
                'valid_id' => $validIdPath,
                'password' => Hash::make($request->password),
            ]);
            
            // Generate OTP code
            $code = $this->verificationService->generateOtp($user->email, 'sk');
            
            // Send OTP email
            $this->verificationService->sendOtpEmail($user->email, $user->first_name, $code);

            return response()->json([
                'success' => true,
                'user' => $user,
                'needsVerification' => true,
                'debug' => [
                    'file_path' => $validIdPath,
                    'public_url' => asset('storage/' . $validIdPath),
                    'storage_exists' => Storage::disk('public')->exists($validIdPath),
                    'public_exists' => file_exists(public_path('storage/' . $validIdPath))
                ]
            ]);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'errors' => ['general' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Handle SK logout requests.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Remove from session
        $request->session()->forget('sk_user');
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return response()->json(['success' => true]);
    }

    /**
     * Get the authenticated SK user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function user(Request $request)
    {
        $skUser = session('sk_user');
        
        if ($skUser) {
            return response()->json([
                'authenticated' => true,
                'user' => $skUser
            ]);
        }
        
        return response()->json(['authenticated' => false]);
    }
    
    /**
     * Verify OTP code for SK user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'code' => 'required|string|size:6',
        ]);
        
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'sk'
        );
        
        if ($isValid) {
            return response()->json([
                'success' => true,
                'message' => 'Your account has been verified successfully.'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code.',
            'isExpired' => $this->verificationService->isOtpExpired($request->email, 'sk')
        ], 400);
    }
    
    /**
     * Resend OTP code for SK user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'force' => 'sometimes|boolean',
        ]);
        
        $force = $request->input('force', false);
        $result = $this->verificationService->resendOtp($request->email, 'sk', $force);
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['is_new'] ? 
                    'Verification code has been sent to your email.' : 
                    'Your verification code is still valid.',
                'remaining_time' => $result['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to send verification code. Please try again later.'
        ], 500);
    }
    
    /**
     * Get the current OTP status and remaining time
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOtpStatus(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
        ]);
        
        $currentOtp = $this->verificationService->getCurrentOtp($request->email, 'sk');
        
        if ($currentOtp['exists']) {
            return response()->json([
                'success' => true,
                'has_active_otp' => $currentOtp['remaining_time'] > 0,
                'remaining_time' => $currentOtp['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => true,
            'has_active_otp' => false,
            'remaining_time' => 0
        ]);
    }

    /**
     * Verify 2FA OTP code for SK user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'code' => 'required|string|size:6',
        ]);
        
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'sk_2fa',
            true // Mark as used after verification
        );
        
        if ($isValid) {
            // Find the SK account
            $skAccount = Skaccount::where('email', $request->email)->first();
            
            if (!$skAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.'
                ], 404);
            }
            
            // Store user in session with clear session ID
            session(['sk_user' => $skAccount]);
            session(['sk_2fa_verified' => true]); // Add a flag to indicate 2FA is verified
            $request->session()->regenerate(); // Regenerate session ID for security
            
            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication successful.',
                'user' => $skAccount
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code.',
            'isExpired' => $this->verificationService->isOtpExpired($request->email, 'sk_2fa')
        ], 400);
    }

    /**
     * Resend 2FA OTP code for SK user
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resend2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'force' => 'sometimes|boolean',
        ]);
        
        $force = $request->input('force', false);
        $result = $this->verificationService->resendOtp($request->email, 'sk_2fa', $force);
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['is_new'] ? 
                    'Verification code has been sent to your email.' : 
                    'Your verification code is still valid.',
                'remaining_time' => $result['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to send verification code. Please try again later.'
        ], 500);
    }

    /**
     * Get 2FA OTP status and remaining time
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function get2FAStatus(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
        ]);
        
        $currentOtp = $this->verificationService->getCurrentOtp($request->email, 'sk_2fa');
        
        if ($currentOtp['exists']) {
            return response()->json([
                'success' => true,
                'has_active_otp' => $currentOtp['remaining_time'] > 0,
                'remaining_time' => $currentOtp['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => true,
            'has_active_otp' => false,
            'remaining_time' => 0
        ]);
    }
}