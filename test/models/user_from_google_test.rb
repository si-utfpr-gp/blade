require "test_helper"

class UserFromGoogleTest < ActiveSupport::TestCase
  # Minimal stand-in for the OmniAuth hash. Only the parts from_google reads are
  # present, so an accidental dependency on the full hash shape shows up here.
  def auth(uid:, email: "aluno@utfpr.edu.br", name: "Ana Souza", verified: true, image: nil)
    {
      "provider" => "google_oauth2",
      "uid" => uid,
      "info" => {
        "email" => email,
        "name" => name,
        "image" => image
      },
      "extra" => {
        "raw_info" => { "email_verified" => verified }
      }
    }
  end

  setup do
    User.delete_all
  end

  test "creates the user from the Google identity" do
    user = User.from_google(auth(uid: "1234567890"))

    assert_equal "1234567890", user.provider_uid
    assert_equal "google_oauth2", user.provider
    assert_equal "aluno@utfpr.edu.br", user.login
    assert_equal "Ana Souza", user.name
    assert user.persisted?
  end

  test "returns the same user on a second sign in" do
    first = User.from_google(auth(uid: "1234567890"))
    second = User.from_google(auth(uid: "1234567890"))

    assert_equal first.id, second.id
    assert_equal 1, User.count
  end

  # The whole reason provider_uid exists: Google lets a person change their
  # email. Looking the user up by email would orphan their algorithms.
  test "finds the user by provider_uid even when the email changed" do
    user = User.from_google(auth(uid: "1234567890", email: "antigo@utfpr.edu.br"))

    again = User.from_google(auth(uid: "1234567890", email: "novo@utfpr.edu.br"))

    assert_equal user.id, again.id
    assert_equal "novo@utfpr.edu.br", again.login
    assert_equal 1, User.count
  end

  # Google guarantees one address is one account, so this should not happen in
  # practice. If it ever did, refusing is the safe outcome: merging would hand
  # the first person's algorithms to whoever arrived second.
  test "refuses a different identity presenting an email already in use" do
    User.from_google(auth(uid: "111", email: "comum@utfpr.edu.br"))

    assert_raises(ActiveRecord::RecordInvalid) do
      User.from_google(auth(uid: "222", email: "comum@utfpr.edu.br"))
    end

    assert_equal 1, User.count
    assert_equal "111", User.find_by(login: "comum@utfpr.edu.br").provider_uid
  end

  test "refreshes the name and avatar on a later sign in" do
    User.from_google(auth(uid: "1234567890", name: "Nome Antigo", image: nil))

    user = User.from_google(auth(uid: "1234567890", name: "Nome Novo", image: "https://x/a.png"))

    assert_equal "Nome Novo", user.name
    assert_equal "https://x/a.png", user.avatar_url
  end

  test "refuses an account without an email" do
    error = assert_raises(User::EmailRequired) do
      User.from_google(auth(uid: "1", email: nil))
    end

    assert_match(/email/i, error.message)
    assert_equal 0, User.count
  end

  test "refuses an unverified email" do
    error = assert_raises(User::EmailNotVerified) do
      User.from_google(auth(uid: "1", verified: false))
    end

    assert_match(/verificad/i, error.message)
    assert_equal 0, User.count
  end

  test "stores the avatar only when present" do
    user = User.from_google(auth(uid: "1", image: nil))

    assert_nil user.avatar_url
  end

  test "ldap columns stay untouched so the future work is unaffected" do
    user = User.from_google(auth(uid: "1"))

    assert_nil user.ldap_uid
    assert_nil user.ldap_email
  end

  test "the development user keeps working without any Google identity" do
    dev = User.dev_user

    assert_equal User::DEV_LOGIN, dev.login
    assert_nil dev.provider_uid
  end

  test "explains a Google account without an email in plain Portuguese" do
    error = assert_raises(User::EmailRequired) { User.from_google(auth(uid: "sem-email", email: nil)) }

    assert_equal "A conta do Google não informa um email.", error.message
  end
end
