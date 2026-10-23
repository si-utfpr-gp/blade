# A signed in browser. The cookie carries only the id; the row records where
# the sign in came from, until DataRetention says to forget it.
class Session < ApplicationRecord
  # last_seen_at is written at most this often, not on every autosave.
  SEEN_EVERY = 1.hour

  belongs_to :user

  scope :active, -> { where(last_seen_at: DataRetention::SESSION_IDLE.ago..) }

  def self.start(user, request)
    create!(
      user: user,
      ip_address: request.remote_ip,
      user_agent: request.user_agent.to_s.first(255).presence,
      last_seen_at: Time.current
    )
  end

  def seen!
    update_column(:last_seen_at, Time.current) if last_seen_at < SEEN_EVERY.ago
  end
end
