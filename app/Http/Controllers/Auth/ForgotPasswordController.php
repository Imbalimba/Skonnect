<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Skaccount;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;

class ForgotPasswordController extends Controller
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
     * Handle forgot password request for youth users.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPasswordYouth(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
        ]);

        // Rate limiting check is handled via middleware in the routes file

        try {
            // Find the account
            $account = Account::where('email', $request->email)->first();
            
            if (!$account) {
                return response()->json([
                    'success' => false,
                    'message' => 'We could not find a user with that email address.'
                ], 404);
            }
            
            // Generate OTP code for password reset
            $code = $this->verificationService->generateOtp($account->email, 'youth_reset');
            
            // Send OTP email
            $this->verificationService->sendOtpEmail($account->email, $account->first_name, $code, 'reset');
            
            return response()->json([
                'success' => true,
                'message' => 'Password reset code has been sent to your email.',
                'email' => $account->email
            ]);
        } catch (\Exception $e) {
            Log::error('Forgot password error: '.$e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request. Please try again later.'
            ], 500);
        }
    }
    
    /**
     * Handle forgot password request for SK users.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function forgotPasswordSk(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
        ]);

        // Rate limiting check is handled via middleware in the routes file

        try {
            // Find the account
            $skAccount = Skaccount::where('email', $request->email)->first();
            
            if (!$skAccount) {
                return response()->json([
                    'success' => false,
                    'message' => 'We could not find a user with that email address.'
                ], 404);
            }
            
            // Generate OTP code for password reset
            $code = $this->verificationService->generateOtp($skAccount->email, 'sk_reset');
            
            // Send OTP email
            $this->verificationService->sendOtpEmail($skAccount->email, $skAccount->first_name, $code, 'reset');
            
            return response()->json([
                'success' => true,
                'message' => 'Password reset code has been sent to your email.',
                'email' => $skAccount->email
            ]);
        } catch (\Exception $e) {
            Log::error('Forgot password error: '.$e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your request. Please try again later.'
            ], 500);
        }
    }
    
    /**
     * Verify OTP for youth user password reset
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyResetOtpYouth(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
            'code' => 'required|string|size:6',
        ]);
        
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'youth_reset',
            false // Don't automatically mark as verified
        );
        
        if ($isValid) {
            return response()->json([
                'success' => true,
                'message' => 'Verification successful. You can now reset your password.',
                'email' => $request->email
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code.',
            'isExpired' => $this->verificationService->isOtpExpired($request->email, 'youth_reset')
        ], 400);
    }
    
    /**
     * Verify OTP for SK user password reset
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyResetOtpSk(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'code' => 'required|string|size:6',
        ]);
        
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'sk_reset',
            false // Don't automatically mark as verified
        );
        
        if ($isValid) {
            return response()->json([
                'success' => true,
                'message' => 'Verification successful. You can now reset your password.',
                'email' => $request->email
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Invalid or expired verification code.',
            'isExpired' => $this->verificationService->isOtpExpired($request->email, 'sk_reset')
        ], 400);
    }
    
    /**
     * Reset password for youth user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPasswordYouth(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
            'code' => 'required|string|size:6',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);
        
        // First, verify the OTP again to ensure security
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'youth_reset',
            true // Mark as used after verification
        );
        
        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code.',
                'isExpired' => $this->verificationService->isOtpExpired($request->email, 'youth_reset')
            ], 400);
        }
        
        // Find the account and update password
        $account = Account::where('email', $request->email)->first();
        
        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }
        
        // Update the password
        $account->password = Hash::make($request->password);
        $account->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset successfully. You can now login with your new password.'
        ]);
    }
    
    /**
     * Reset password for SK user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPasswordSk(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'code' => 'required|string|size:6',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);
        
        // First, verify the OTP again to ensure security
        $isValid = $this->verificationService->verifyOtp(
            $request->email, 
            $request->code,
            'sk_reset',
            true // Mark as used after verification
        );
        
        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification code.',
                'isExpired' => $this->verificationService->isOtpExpired($request->email, 'sk_reset')
            ], 400);
        }
        
        // Find the account and update password
        $skAccount = Skaccount::where('email', $request->email)->first();
        
        if (!$skAccount) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }
        
        // Update the password
        $skAccount->password = Hash::make($request->password);
        $skAccount->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Your password has been reset successfully. You can now login with your new password.'
        ]);
    }
    
    /**
     * Resend OTP for youth password reset
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendResetOtpYouth(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
            'force' => 'sometimes|boolean',
        ]);
        
        // Rate limiting check is handled via middleware in the routes file
        
        $force = $request->input('force', false);
        $result = $this->verificationService->resendOtp($request->email, 'youth_reset', $force, 'reset');
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['is_new'] ? 
                    'Password reset code has been sent to your email.' : 
                    'Your password reset code is still valid.',
                'remaining_time' => $result['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to send password reset code. Please try again later.'
        ], 500);
    }
    
    /**
     * Resend OTP for SK password reset
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendResetOtpSk(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
            'force' => 'sometimes|boolean',
        ]);
        
        // Rate limiting check is handled via middleware in the routes file
        
        $force = $request->input('force', false);
        $result = $this->verificationService->resendOtp($request->email, 'sk_reset', $force, 'reset');
        
        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['is_new'] ? 
                    'Password reset code has been sent to your email.' : 
                    'Your password reset code is still valid.',
                'remaining_time' => $result['remaining_time']
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Failed to send password reset code. Please try again later.'
        ], 500);
    }
    
    /**
     * Get OTP status for youth password reset
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResetOtpStatusYouth(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:accounts,email',
        ]);
        
        $currentOtp = $this->verificationService->getCurrentOtp($request->email, 'youth_reset');
        
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
     * Get OTP status for SK password reset
     * 
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getResetOtpStatusSk(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:skaccounts,email',
        ]);
        
        $currentOtp = $this->verificationService->getCurrentOtp($request->email, 'sk_reset');
        
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