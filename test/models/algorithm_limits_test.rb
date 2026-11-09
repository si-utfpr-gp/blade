require "test_helper"

class AlgorithmLimitsTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(login: "aluno-limites", name: "Aluno Limites")
  end

  test "accepts a name at the builder's limit" do
    algorithm = Algorithm.new(user: @user, name: "a" * Algorithm::NAME_MAX_LENGTH)

    assert algorithm.valid?
  end

  test "rejects a name longer than the builder allows" do
    algorithm = Algorithm.new(user: @user, name: "a" * (Algorithm::NAME_MAX_LENGTH + 1))

    assert_not algorithm.valid?
    assert_includes algorithm.errors[:name], "O nome pode ter no máximo #{Algorithm::NAME_MAX_LENGTH} caracteres"
  end

  test "rejects a diagram larger than the size limit" do
    label = "x" * 1_000
    nodes = Array.new((Algorithm::DIAGRAM_MAX_BYTES / 1_000) + 1) { |i| { "id" => "n#{i}", "label" => label } }
    algorithm = Algorithm.new(user: @user, name: "Grande", diagram: { "nodes" => nodes, "edges" => [] })

    assert_not algorithm.valid?
    assert_includes algorithm.errors[:diagram], "O diagrama é grande demais para ser salvo"
  end

  test "rejects a diagram with more blocks than the limit" do
    nodes = Array.new(Algorithm::DIAGRAM_MAX_NODES + 1) { |i| { "id" => "n#{i}" } }
    algorithm = Algorithm.new(user: @user, name: "Muitos", diagram: { "nodes" => nodes, "edges" => [] })

    assert_not algorithm.valid?
    assert_includes algorithm.errors[:diagram], "O diagrama pode ter no máximo #{Algorithm::DIAGRAM_MAX_NODES} blocos"
  end

  test "stops a student from saving more algorithms than the limit" do
    Algorithm::MAX_PER_USER.times do |i|
      Algorithm.create!(user: @user, name: "Algoritmo #{i}")
    end

    algorithm = Algorithm.new(user: @user, name: "Um a mais")

    assert_not algorithm.valid?
    assert_includes algorithm.errors[:base], "Você já tem #{Algorithm::MAX_PER_USER} algoritmos salvos; apague algum para salvar outro"
  end

  test "lets a student at the limit keep updating an existing algorithm" do
    Algorithm::MAX_PER_USER.times do |i|
      Algorithm.create!(user: @user, name: "Algoritmo #{i}")
    end

    algorithm = @user.algorithms.first
    algorithm.name = "Renomeado"

    assert algorithm.valid?
  end
end
