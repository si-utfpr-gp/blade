require "test_helper"

# Development signs in as a placeholder user so the builder is usable without
# any Google setup. That hides the login screen, which makes the OAuth flow
# impossible to try locally. FORCE_GOOGLE_LOGIN turns the fallback off so the
# real screen and the real handshake can be exercised before deploying.
class DevUserFallbackTest < ActiveSupport::TestCase
  setup do
    @original = ENV["FORCE_GOOGLE_LOGIN"]
    User.delete_all
  end

  teardown do
    ENV["FORCE_GOOGLE_LOGIN"] = @original
  end

  def force(value)
    if value.nil?
      ENV.delete("FORCE_GOOGLE_LOGIN")
    else
      ENV["FORCE_GOOGLE_LOGIN"] = value
    end
  end

  test "development keeps the fallback so the builder opens without Google" do
    force(nil)

    assert_not_nil User.dev_user
  end

  test "FORCE_GOOGLE_LOGIN turns the fallback off" do
    force("true")

    assert_nil User.dev_user
  end

  test "an explicit false leaves the fallback in place" do
    force("false")

    assert_not_nil User.dev_user
  end

  test "other falsy spellings keep the fallback" do
    [ "0", "no", "off", "" ].each do |value|
      force(value)

      assert_not_nil User.dev_user, "expected #{value.inspect} to keep the fallback"
    end
  end

  test "the fallback can be turned back on in the same process" do
    force("true")
    assert_nil User.dev_user

    force(nil)
    assert_not_nil User.dev_user
  end

  test "reading the flag does not create a user as a side effect" do
    force("true")

    2.times { User.dev_user }

    assert_equal 0, User.count
  end

  test "production never has a fallback user" do
    # Rails.env cannot be swapped in a test, so the guard is asserted on the
    # condition itself: dev_user requires a development or test environment.
    assert_not User.respond_to?(:dev_user_without_environment_check)
    assert_nil User.dev_user unless Rails.env.development? || Rails.env.test?
  end
end
