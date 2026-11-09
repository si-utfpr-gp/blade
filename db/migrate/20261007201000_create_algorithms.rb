class CreateAlgorithms < ActiveRecord::Migration[8.1]
  def change
    create_table :algorithms do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :diagram, null: false, default: { nodes: [], edges: [] }

      t.timestamps
    end

    add_index :algorithms, [ :user_id, :name ]
  end
end
