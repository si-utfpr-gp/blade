require "test_helper"

class AlgorithmTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(login: "aluno-alg", name: "Aluno Algoritmo")
  end

  test "requires a name" do
    algorithm = Algorithm.new(user: @user, diagram: { "nodes" => [], "edges" => [] })

    assert_not algorithm.valid?
    assert_includes algorithm.errors[:name], "can't be blank"
  end

  test "stores the diagram as structured json" do
    algorithm = Algorithm.create!(
      user: @user,
      name: "Soma",
      diagram: { "nodes" => [ { "id" => "n1" } ], "edges" => [] }
    )

    assert_equal [ { "id" => "n1" } ], algorithm.diagram["nodes"]
    assert_equal [], algorithm.diagram["edges"]
  end

  test "defaults to an empty diagram" do
    algorithm = Algorithm.create!(user: @user, name: "Vazio")

    assert_equal [], algorithm.diagram["nodes"]
    assert_equal [], algorithm.diagram["edges"]
  end

  test "is destroyed together with its user" do
    algorithm = Algorithm.create!(user: @user, name: "Dependent", diagram: { "nodes" => [], "edges" => [] })

    @user.destroy!

    assert_nil Algorithm.find_by(id: algorithm.id)
  end
end
