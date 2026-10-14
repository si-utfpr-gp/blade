class EnforceUniqueAlgorithmNamePerUser < ActiveRecord::Migration[8.1]
  def up
    # The unique index cannot be created while duplicates exist. The oldest
    # record keeps the name and the later ones get a numbered suffix, so nothing
    # a student saved is lost and the duplicates become editable.
    rename_duplicates

    remove_index :algorithms, name: "index_algorithms_on_user_id_and_name"

    # On lower(name) so "Contador" and "contador" count as the same algorithm:
    # two records differing only in case are indistinguishable in the dropdown.
    add_index :algorithms,
              "user_id, lower(name)",
              unique: true,
              name: "index_algorithms_on_user_id_and_lower_name"
  end

  def down
    remove_index :algorithms, name: "index_algorithms_on_user_id_and_lower_name"

    add_index :algorithms, [ :user_id, :name ],
              name: "index_algorithms_on_user_id_and_name"
  end

  private

  def rename_duplicates
    seen = Hash.new(0)

    Algorithm.unscoped.order(:id).each do |algorithm|
      key = [ algorithm.user_id, algorithm.name.to_s.strip.downcase ]
      seen[key] += 1
      next if seen[key] == 1

      candidate = "#{algorithm.name} (#{seen[key]})"
      candidate = "#{candidate}-#{algorithm.id}" while taken?(key.first, candidate)

      algorithm.update_column(:name, candidate)
    end
  end

  def taken?(user_id, name)
    Algorithm.unscoped.where(user_id: user_id)
              .where("lower(btrim(name)) = ?", name.strip.downcase)
              .exists?
  end
end
