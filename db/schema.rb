# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_23_120100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "algorithms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "diagram", default: {"edges" => [], "nodes" => []}, null: false
    t.string "name", null: false
    t.string "share_token"
    t.datetime "shared_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index "user_id, lower((name)::text)", name: "index_algorithms_on_user_id_and_lower_name", unique: true
    t.index ["share_token"], name: "index_algorithms_on_share_token", unique: true
    t.index ["user_id"], name: "index_algorithms_on_user_id"
  end

  create_table "audit_events", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.jsonb "details", default: {}, null: false
    t.string "ip_address"
    t.bigint "subject_id"
    t.string "subject_type"
    t.bigint "user_id"
    t.index ["created_at"], name: "index_audit_events_on_created_at"
    t.index ["subject_type", "subject_id"], name: "index_audit_events_on_subject_type_and_subject_id"
    t.index ["user_id"], name: "index_audit_events_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "last_seen_at", null: false
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["last_seen_at"], name: "index_sessions_on_last_seen_at"
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "ldap_email"
    t.string "ldap_uid"
    t.string "login", null: false
    t.string "name", null: false
    t.string "provider"
    t.string "provider_uid"
    t.datetime "updated_at", null: false
    t.index ["login"], name: "index_users_on_login", unique: true
    t.index ["provider", "provider_uid"], name: "index_users_on_provider_and_provider_uid", unique: true
  end

  add_foreign_key "algorithms", "users"
  add_foreign_key "audit_events", "users", on_delete: :nullify
  add_foreign_key "sessions", "users", on_delete: :cascade
end
