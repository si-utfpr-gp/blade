class CreateAuditEvents < ActiveRecord::Migration[8.1]
  def change
    # Who did what and when. The subject is not a foreign key: a deleted
    # algorithm keeps its record. A deleted user leaves the events behind,
    # anonymous.
    create_table :audit_events do |t|
      t.references :user, foreign_key: { on_delete: :nullify }
      t.string :action, null: false
      t.string :subject_type
      t.bigint :subject_id
      t.jsonb :details, null: false, default: {}
      t.string :ip_address
      t.datetime :created_at, null: false
    end
    add_index :audit_events, :created_at
    add_index :audit_events, [ :subject_type, :subject_id ]
  end
end
