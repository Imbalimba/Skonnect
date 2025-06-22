<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Skaccount;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpVerificationMail;
use App\Mail\PasswordResetMail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class EmailVerificationService
{
    /**
     * Generate and store a verification code for a user
     * 
     * @param string $email
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @return string The generated OTP code
     */
    public function generateOtp(string $email, string $type): string
    {
        // Generate a random 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Calculate expiration time (5 minutes from now)
        $expiresAt = Carbon::now()->addMinutes(5);
        
        // Store the code in the database
        VerificationCode::updateOrCreate(
            ['email' => $email, 'type' => $type],
            ['code' => $code, 'expires_at' => $expiresAt]
        );
        
        return $code;
    }
    
    /**
     * Send OTP verification email
     * 
     * @param string $email
     * @param string $name
     * @param string $code
     * @param string $purpose 'verification' or 'reset'
     * @return bool
     */
    public function sendOtpEmail(string $email, string $name, string $code, string $purpose = 'verification'): bool
    {
        try {
            if ($purpose === 'reset') {
                Mail::to($email)->send(new PasswordResetMail($name, $code));
            } else {
                Mail::to($email)->send(new OtpVerificationMail($name, $code));
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verify an OTP code
     * 
     * @param string $email
     * @param string $code
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @param bool $markVerified Whether to mark user as verified (for email verification) or delete OTP (for password reset)
     * @return bool
     */
    public function verifyOtp(string $email, string $code, string $type, bool $markVerified = true): bool
    {
        $verificationCode = VerificationCode::where('email', $email)
            ->where('type', $type)
            ->where('code', $code)
            ->first();
            
        if (!$verificationCode) {
            return false;
        }
        
        // Check if code has expired
        if (Carbon::now()->isAfter(Carbon::parse($verificationCode->expires_at))) {
            return false;
        }
        
        // If we're not verifying the email or using the code once for reset, just return true
        if (!$markVerified) {
            return true;
        }
        
        // Mark the account as verified for email verification types
        if ($type === 'youth') {
            $account = Account::where('email', $email)->first();
            if ($account) {
                $account->verification_status = 'verified';
                $account->email_verified_at = Carbon::now();
                $account->save();
            }
        } else if ($type === 'sk') {
            $skAccount = Skaccount::where('email', $email)->first();
            if ($skAccount) {
                $skAccount->verification_status = 'verified';
                $skAccount->email_verified_at = Carbon::now();
                $skAccount->save();
            }
        }
        
        // Delete the code after successful verification
        $verificationCode->delete();
        
        return true;
    }
    
    /**
     * Check if an OTP is expired
     * 
     * @param string $email
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @return bool
     */
    public function isOtpExpired(string $email, string $type): bool
    {
        $verificationCode = VerificationCode::where('email', $email)
            ->where('type', $type)
            ->first();
            
        if (!$verificationCode) {
            return true;
        }
        
        return Carbon::now()->isAfter(Carbon::parse($verificationCode->expires_at));
    }
    
    /**
     * Get the remaining time in seconds for an OTP
     * 
     * @param string $email
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @return int Remaining seconds, 0 if expired or not found
     */
    public function getOtpRemainingTime(string $email, string $type): int
    {
        $verificationCode = VerificationCode::where('email', $email)
            ->where('type', $type)
            ->first();
            
        if (!$verificationCode) {
            return 0;
        }
        
        $expiresAt = Carbon::parse($verificationCode->expires_at);
        $now = Carbon::now();
        
        if ($now->isAfter($expiresAt)) {
            return 0;
        }
        
        return $now->diffInSeconds($expiresAt);
    }
    
    /**
     * Get current OTP code if exists and not expired
     * 
     * @param string $email
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @return array ['exists' => bool, 'code' => string|null, 'remaining_time' => int]
     */
    public function getCurrentOtp(string $email, string $type): array
    {
        $verificationCode = VerificationCode::where('email', $email)
            ->where('type', $type)
            ->first();
            
        if (!$verificationCode) {
            return [
                'exists' => false,
                'code' => null,
                'remaining_time' => 0
            ];
        }
        
        $expiresAt = Carbon::parse($verificationCode->expires_at);
        $now = Carbon::now();
        
        if ($now->isAfter($expiresAt)) {
            return [
                'exists' => true,
                'code' => null,
                'remaining_time' => 0
            ];
        }
        
        return [
            'exists' => true,
            'code' => $verificationCode->code,
            'remaining_time' => $now->diffInSeconds($expiresAt)
        ];
    }
    
    /**
     * Resend an OTP code
     * 
     * @param string $email
     * @param string $type 'youth', 'sk', 'youth_reset', or 'sk_reset'
     * @param bool $force Whether to force a new OTP even if current one is valid
     * @param string $purpose 'verification' or 'reset'
     * @return array ['success' => bool, 'code' => string|null, 'remaining_time' => int]
     */
    public function resendOtp(string $email, string $type, bool $force = false, string $purpose = 'verification'): array
    {
        // Check if there's a valid OTP already
        $currentOtp = $this->getCurrentOtp($email, $type);
        
        // If there's a valid OTP and we're not forcing a new one, just return it
        if (!$force && $currentOtp['exists'] && $currentOtp['remaining_time'] > 0) {
            // Get the user's name
            $name = '';
            if (in_array($type, ['youth', 'youth_reset'])) {
                $account = Account::where('email', $email)->first();
                $name = $account ? $account->first_name : 'User';
            } else {
                $skAccount = Skaccount::where('email', $email)->first();
                $name = $skAccount ? $skAccount->first_name : 'User';
            }
            
            return [
                'success' => true,
                'code' => $currentOtp['code'],
                'remaining_time' => $currentOtp['remaining_time'],
                'is_new' => false
            ];
        }
        
        // Get the user's name
        $name = '';
        if (in_array($type, ['youth', 'youth_reset'])) {
            $account = Account::where('email', $email)->first();
            $name = $account ? $account->first_name : 'User';
        } else {
            $skAccount = Skaccount::where('email', $email)->first();
            $name = $skAccount ? $skAccount->first_name : 'User';
        }
        
        // Generate a new OTP
        $code = $this->generateOtp($email, $type);
        
        // Send the OTP email
        $sent = $this->sendOtpEmail($email, $name, $code, $purpose);
        
        return [
            'success' => $sent,
            'code' => $sent ? $code : null,
            'remaining_time' => 300, // 5 minutes in seconds
            'is_new' => true
        ];
    }
}