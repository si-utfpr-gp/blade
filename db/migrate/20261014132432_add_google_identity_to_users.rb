class AddGoogleIdentityToUsers < ActiveRecord::Migration[8.1]
  def change
    # provider_uid holds Google immutable `sub` claim. The unique pair is the
    # real identity key: `login` also holds the email, which Google lets people
    # change, so it cannot be trusted to identify the same person over time.
    add_column :users, :provider, :string
    add_column :users, :provider_uid, :string
    add_column :users, :avatar_url, :string

    add_index :users, [ :provider, :provider_uid ], unique: true
  end
end
