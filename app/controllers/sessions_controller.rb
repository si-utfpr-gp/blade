class SessionsController < ApplicationController
  # The callback and the login page must stay reachable without a session.
  skip_before_action :verify_authenticity_token, only: :create

  # The callback creates sessions and users, so repeated hits from one address
  # are cut off. The count is per address because nobody is signed in yet, and
  # a whole class signs in at once from the campus network, behind one
  # address: the limit has to fit a class of 200.
  rate_limit to: 300, within: 1.minute, only: :create, store: RATE_LIMIT_STORE,
             with: -> { redirect_to login_path, alert: "Muitas tentativas de entrar. Espere um minuto e tente de novo." }

  # The login page: sign in as a student or open the builder as a guest. It is
  # shown signed in too, offering to continue rather than bouncing the visitor.
  def new
    @user = current_user
    @error = flash[:alert]
  end

  def create
    auth = request.env["omniauth.auth"]

    if auth.blank?
      redirect_to login_path, alert: "Não foi possível falar com o Google. Tente novamente."
      return
    end

    user = User.from_google(auth)
    if user.previously_new_record?
      AuditEvent.record("account.created", user: user, request: request, subject: user)
    end
    sign_in(user)
    redirect_to builder_index_path
  rescue User::EmailRequired, User::EmailNotVerified, User::DomainNotAllowed => e
    redirect_to login_path, alert: e.message
  rescue ActiveRecord::RecordInvalid
    redirect_to login_path,
                alert: "Não foi possível criar seu acesso. Fale com o suporte."
  end

  # The student cancelled at Google, or the request expired. OmniAuth's own
  # message is not shown: it is technical and says nothing useful to them.
  def failure
    redirect_to login_path, alert: "O login com o Google não foi concluído. Tente novamente."
  end

  def destroy
    sign_out
    redirect_to root_path
  end

  private

  # A brand new session id on sign in prevents session fixation, where an id
  # planted by an attacker before login would stay valid afterwards.
  def sign_in(user)
    reset_session
    session[:user_session_id] = Session.start(user, request).id
    AuditEvent.record("session.signed_in", user: user, request: request)
  end

  # The Session row goes too, so the cookie is dead even if it was copied.
  def sign_out
    if current_session
      audit "session.signed_out"
      current_session.destroy
    end
    reset_session
    session[:signed_out] = true
  end
end
