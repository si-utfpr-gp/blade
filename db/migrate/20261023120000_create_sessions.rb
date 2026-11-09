class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    # One row per sign in: the cookie holds only its id, so a session can be
    # listed and ended from the server. Deleting a user takes its sessions.
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: { on_delete: :cascade }
      t.string :ip_address
      t.string :user_agent
      t.datetime :last_seen_at, null: false
      t.timestamps
    end
    add_index :sessions, :last_seen_at
  end
end
