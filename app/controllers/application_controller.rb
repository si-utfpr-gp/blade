class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Where rate limits count requests. The test environment turns Rails.cache
  # off (null store), which would switch every limit off with it, so tests get
  # a store of their own, cleared before each test.
  RATE_LIMIT_STORE = Rails.env.test? ? ActiveSupport::Cache::MemoryStore.new : Rails.cache
  TOO_MANY_REQUESTS = "muitas requisições, espere um minuto e tente de novo".freeze

  private

  # Authentication seam. It resolves to a development user so the builder works
  # without Google configured; when a real sign in is needed only
  # current_user_from_fallback changes and callers keep working.
  # Current.user lets tests and background jobs bypass the session lookup.
  def current_user
    Current.user ||= User.find_by(id: session[:user_id]) ||
      current_user_from_fallback.tap { |user| session[:user_id] = user&.id }
  end

  # After signing out the fallback stays off, or the development user would
  # sign straight back in and Sair would look broken. The next sign in resets
  # the session, which turns it back on.
  def current_user_from_fallback
    return nil if session[:signed_out]

    User.dev_user
  end

  # HTML is sent to the landing page, where signing in happens; the API keeps
  # answering 401 JSON.
  def require_login
    return if current_user

    respond_to do |format|
      format.html { redirect_to root_path }
      format.json { render json: { error: NOT_AUTHENTICATED }, status: :unauthorized }
    end
  end

  def authenticate_user!
    return if current_user

    render json: { error: NOT_AUTHENTICATED }, status: :unauthorized
  end

  NOT_AUTHENTICATED = "acesso não autorizado".freeze
end
