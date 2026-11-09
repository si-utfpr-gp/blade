require "test_helper"

class SessionTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(login: "ana@utfpr.edu.br", name: "Ana")
    @request = Struct.new(:remote_ip, :user_agent).new("200.134.10.1", "Firefox")
  end

  test "start records where the sign in came from" do
    session = Session.start(@user, @request)

    assert_equal "200.134.10.1", session.ip_address
    assert_equal "Firefox", session.user_agent
    assert_in_delta Time.current, session.last_seen_at, 1.second
  end

  # Autosave hits the server every few seconds; writing last_seen_at on each
  # request would double the writes for nothing.
  test "seen! writes at most once an hour" do
    session = Session.start(@user, @request)
    first = session.last_seen_at

    travel 10.minutes do
      session.seen!
      assert_equal first, session.reload.last_seen_at
    end

    travel 2.hours do
      session.seen!
      assert_in_delta Time.current, session.reload.last_seen_at, 1.second
    end
  end

  test "a session idle past DataRetention::SESSION_IDLE is no longer active" do
    session = Session.start(@user, @request)

    assert_includes Session.active, session
    travel DataRetention::SESSION_IDLE + 1.day do
      assert_not_includes Session.active, session
    end
  end
end
