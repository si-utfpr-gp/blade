# A public link for an algorithm, turned on by its owner. The token, not the
# id, goes in the URL, so links cannot be found by counting; the unique index
# backs the lookup and rules out two algorithms behind one link.
class AddShareTokenToAlgorithms < ActiveRecord::Migration[8.1]
  def change
    add_column :algorithms, :share_token, :string
    add_column :algorithms, :shared_at, :datetime
    add_index :algorithms, :share_token, unique: true
  end
end
