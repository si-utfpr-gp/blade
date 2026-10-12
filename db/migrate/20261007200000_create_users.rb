class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :login, null: false
      t.string :name, null: false
      t.string :ldap_uid
      t.string :ldap_email

      t.timestamps
    end

    add_index :users, :login, unique: true
  end
end
