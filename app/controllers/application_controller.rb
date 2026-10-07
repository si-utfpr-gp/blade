class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  private

  # Authentication seam. Today this resolves to a development user so the
  # builder works without an LDAP server; when the university LDAP is wired in,
  # only the session lookup changes and callers keep working.
  def current_user
    @current_user ||= User.find_by(id: session[:user_id]) || current_user_from_fallback.tap do |user|
      session[:user_id] = user&.id
    end
  end

  def current_user_from_fallback
    User.dev_user
  end

  def authenticate_user!
    return if current_user

    render json: { error: "não autenticado" }, status: :unauthorized
  end
end
