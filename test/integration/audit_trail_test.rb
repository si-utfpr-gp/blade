require "test_helper"

# Sign ins live in Session rows and the actions an audit needs are recorded,
# with the address they came from.
class AuditTrailTest < ActionDispatch::IntegrationTest
  setup do
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: "google_oauth2", uid: "sub-audit", info: { email: "ana@utfpr.edu.br", name: "Ana" },
      extra: { raw_info: { email_verified: true } }
    )
  end

  teardown do
    OmniAuth.config.test_mode = false
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    ENV.delete("FORCE_GOOGLE_LOGIN")
  end

  def sign_in
    get "/auth/google_oauth2/callback"
    User.find_by!(provider_uid: "sub-audit")
  end

  def actions_for(user)
    AuditEvent.where(user: user).order(:id).pluck(:action)
  end

  test "the first sign in records the new account and the session" do
    user = sign_in

    assert_equal %w[account.created session.signed_in], actions_for(user)
    assert_equal "127.0.0.1", AuditEvent.last.ip_address
    assert_equal 1, user.sessions.count
    assert_equal user.sessions.first.id, session[:user_session_id]
  end

  test "signing in again records only the session" do
    user = sign_in
    delete logout_url
    sign_in

    assert_equal %w[account.created session.signed_in session.signed_out session.signed_in], actions_for(user)
  end

  # Deleting the row means a copy of the cookie stops working too.
  test "signing out ends the session on the server" do
    user = sign_in

    delete logout_url

    assert_equal 0, user.sessions.count
    assert_nil session[:user_session_id]
  end

  test "an idle session signs the student out" do
    ENV["FORCE_GOOGLE_LOGIN"] = "1"
    sign_in
    get algorithms_url, as: :json
    assert_response :success

    travel DataRetention::SESSION_IDLE + 1.day do
      get algorithms_url, as: :json
      assert_response :unauthorized
    end
  end

  test "creating, sharing and deleting an algorithm are recorded, saving is not" do
    user = sign_in
    post algorithms_url, params: { name: "Média", diagram: { nodes: [], edges: [] } }, as: :json
    id = response.parsed_body["id"]

    patch algorithm_url(id), params: { name: "Média", diagram: { nodes: [], edges: [] } }, as: :json
    post algorithm_share_url(id), as: :json
    delete algorithm_share_url(id), as: :json
    delete algorithm_url(id), as: :json

    assert_equal %w[algorithm.created algorithm.shared algorithm.unshared algorithm.destroyed],
                 actions_for(user).grep(/\Aalgorithm\./)
    destroyed = AuditEvent.find_by!(action: "algorithm.destroyed")
    assert_equal [ "Algorithm", id ], [ destroyed.subject_type, destroyed.subject_id ]
    assert_equal "Média", destroyed.details["name"]
  end
end
