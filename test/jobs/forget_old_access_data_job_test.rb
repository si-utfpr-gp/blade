require "test_helper"

# The privacy page promises these periods; the job is what keeps the promise.
class ForgetOldAccessDataJobTest < ActiveJob::TestCase
  setup do
    @user = User.create!(login: "ana@utfpr.edu.br", name: "Ana")
  end

  def session_at(time, last_seen_at: time)
    Session.create!(user: @user, ip_address: "200.134.10.1", user_agent: "Firefox",
                    last_seen_at: last_seen_at, created_at: time)
  end

  def event_at(time)
    AuditEvent.create!(user: @user, action: "session.signed_in", ip_address: "200.134.10.1", created_at: time)
  end

  test "deletes idle sessions and keeps the ones in use" do
    idle = session_at(31.days.ago)
    in_use = session_at(31.days.ago, last_seen_at: 1.hour.ago)

    ForgetOldAccessDataJob.perform_now

    assert_not Session.exists?(idle.id)
    assert Session.exists?(in_use.id)
  end

  test "erases IP addresses and browsers older than 180 days" do
    old_session = session_at(181.days.ago, last_seen_at: 1.hour.ago)
    old_event = event_at(181.days.ago)
    recent_event = event_at(179.days.ago)

    ForgetOldAccessDataJob.perform_now

    assert_nil old_session.reload.ip_address
    assert_nil old_session.user_agent
    assert_nil old_event.reload.ip_address
    assert_equal "200.134.10.1", recent_event.reload.ip_address
  end

  test "deletes audit events after a year" do
    old_event = event_at(366.days.ago)
    kept = event_at(364.days.ago)

    ForgetOldAccessDataJob.perform_now

    assert_not AuditEvent.exists?(old_event.id)
    assert AuditEvent.exists?(kept.id)
  end

  # A student who comes back years later still finds their work.
  test "never deletes accounts or algorithms" do
    algorithm = Algorithm.create!(user: @user, name: "Antigo", diagram: { "nodes" => [], "edges" => [] })
    travel_to 5.years.from_now do
      ForgetOldAccessDataJob.perform_now
    end

    assert User.exists?(@user.id)
    assert Algorithm.exists?(algorithm.id)
  end
end
