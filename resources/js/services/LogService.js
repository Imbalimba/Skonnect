import axios from 'axios';

/**
 * Service for logging user activities
 */
class LogService {
  /**
   * Log a user action
   * 
   * @param {string} action - The action being performed (login, logout, etc)
   * @param {string} description - Description of the action
   * @param {number|null} userId - SK account ID (null for pre-login actions)
   * @param {string|null} page - The page where action occurred
   * @returns {Promise} - Promise resolving to the logged action
   */
  static async logAction(action, description = null, userId = null, page = null) {
    try {
      const response = await axios.post('/api/sk-user-logs', {
        sk_account_id: userId,
        action,
        description,
        page
      });
      
      return response.data;
    } catch (error) {
      console.error('Error logging action:', error);
      // Don't throw error - logging should not break user experience
      return { success: false };
    }
  }

  /**
   * Log page visit
   * 
   * @param {string} page - The page being visited
   * @param {number|null} userId - SK account ID (null for pre-login actions)
   * @returns {Promise}
   */
  static async logPageVisit(page, userId = null) {
    return this.logAction('page_visit', `Visited ${page} page`, userId, page);
  }

  /**
   * Log login action
   * 
   * @param {number} userId - SK account ID
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async logLogin(userId, email) {
    return this.logAction('login', `User logged in: ${email}`, userId);
  }

  /**
   * Log logout action
   * 
   * @param {number} userId - SK account ID
   * @returns {Promise}
   */
  static async logLogout(userId) {
    return this.logAction('logout', 'User logged out', userId);
  }

  /**
   * Log signup action
   * 
   * @param {number} userId - SK account ID
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async logSignup(userId, email) {
    return this.logAction('signup', `New user registration: ${email}`, userId);
  }

  /**
   * Log email verification action
   * 
   * @param {number} userId - SK account ID
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async logEmailVerification(userId, email) {
    return this.logAction('email_verification', `Email verified: ${email}`, userId);
  }

  /**
   * Log forgot password request
   * 
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async logForgotPassword(email) {
    return this.logAction('forgot_password', `Password reset requested: ${email}`);
  }

  /**
   * Log password reset action
   * 
   * @param {number} userId - SK account ID
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async logPasswordReset(userId, email) {
    return this.logAction('password_reset', `Password reset completed: ${email}`, userId);
  }

  /**
   * Log 2FA verification
   * 
   * @param {number} userId - SK account ID
   * @param {string} email - User email
   * @returns {Promise}
   */
  static async log2FAVerification(userId, email) {
    return this.logAction('2fa_verification', `2FA verification completed: ${email}`, userId);
  }
}

export default LogService;