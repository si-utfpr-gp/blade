require "test_helper"

# Each student has one algorithm per name: a duplicate would show twice in the
# dropdown and make it impossible to tell which one is being edited.
class AlgorithmNameUniquenessTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(login: "ana-#{SecureRandom.hex(4)}", name: "Ana")
    @other = User.create!(login: "bob-#{SecureRandom.hex(4)}", name: "Bob")
    Algorithm.where(user: [ @user, @other ]).delete_all
  end

  def build(user: @user, name: "Contador")
    user.algorithms.build(name: name, diagram: { "nodes" => [], "edges" => [] })
  end

  test "accepts a name the student has not used" do
    assert build(name: "Contador").save
  end

  test "refuses the same name twice for one student" do
    build(name: "Contador").save!

    duplicate = build(name: "Contador")

    assert_not duplicate.valid?
    assert_match(/já existe/i, duplicate.errors[:name].join)
  end

  test "ignores letter case, so Contador and contador are one algorithm" do
    build(name: "Contador").save!

    # Two records differing only in case are confusing in the dropdown, and the
    # student would not understand which one disappeared.
    duplicate = build(name: "cOnTaDoR")

    assert_not duplicate.valid?
  end

  test "ignores surrounding spaces" do
    build(name: "Contador").save!

    assert_not build(name: "  Contador  ").valid?
  end

  test "different students may use the same name" do
    build(user: @user, name: "Contador").save!

    assert build(user: @other, name: "Contador").valid?
  end

  test "an update that keeps its own name stays valid" do
    algorithm = build(name: "Contador").tap(&:save!)

    algorithm.update!(diagram: { "nodes" => [ { "id" => "a" } ], "edges" => [] })

    assert_equal "Contador", algorithm.reload.name
  end

  test "an update to a name already taken is refused" do
    build(name: "Contador").save!
    other = build(name: "Soma").tap(&:save!)

    other.name = "Contador"

    assert_not other.valid?
    assert_equal "Soma", other.reload.name
  end

  test "the database refuses a duplicate even if validation is skipped" do
    build(name: "Contador").save!

    # The index is the last line of defence against concurrent saves, which
    # validation alone cannot cover.
    assert_raises(ActiveRecord::RecordNotUnique) do
      Algorithm.new(
        user: @user,
        name: "CONTADOR",
        diagram: { "nodes" => [], "edges" => [] }
      ).save!(validate: false)
    end
  end

  test "the model can be grouped without the default order breaking it" do
    build(name: "Contador").save!
    build(name: "Soma").save!

    # A default_scope with order made any group or count fail on Postgres.
    grouped = Algorithm.unscoped.group(:user_id).count
    assert_equal 2, grouped.values.first

    assert_nothing_raised { Algorithm.where(user: @user).count }
  end
end
