require "test_helper"

class AlgorithmsControllerTest < ActionDispatch::IntegrationTest
  setup do
    # Exercises the real authentication seam: an empty session falls back to
    # the development user, exactly as the builder behaves in development.
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    @other = User.create!(login: "aluno-outro", name: "Outro Aluno")
    Algorithm.where(user: [ @user, @other ]).delete_all
  end

  test "index lists the current user algorithms, newest first" do
    Algorithm.create!(user: @user, name: "Primeiro", diagram: { "nodes" => [], "edges" => [] })
    Algorithm.create!(user: @user, name: "Segundo", diagram: { "nodes" => [], "edges" => [] })

    get algorithms_url, as: :json

    assert_response :success
    assert_equal [ "Segundo", "Primeiro" ], response.parsed_body.map { |a| a["name"] }
  end

  test "index hides other users algorithms" do
    Algorithm.create!(user: @other, name: "Secreto", diagram: { "nodes" => [], "edges" => [] })

    get algorithms_url, as: :json

    assert_response :success
    assert_empty response.parsed_body
  end

  test "create stores the algorithm for the current user" do
    assert_difference("Algorithm.count") do
      post algorithms_url, params: {
        name: "Meu algoritmo",
        diagram: { nodes: [ { id: "n1", type: "start", position: { x: 1, y: 2 } } ], edges: [] }
      }, as: :json
    end

    assert_response :created
    algorithm = Algorithm.order(:id).last
    assert_equal "Meu algoritmo", algorithm.name
    assert_equal @user, algorithm.user
    assert_equal "n1", algorithm.diagram.dig("nodes", 0, "id")
    assert_equal 1, algorithm.diagram.dig("nodes", 0, "position", "x")
    assert_equal [], algorithm.diagram["edges"]
  end

  test "create rejects a blank name" do
    assert_no_difference("Algorithm.count") do
      post algorithms_url, params: { name: "", diagram: { nodes: [], edges: [] } }, as: :json
    end

    assert_response :unprocessable_entity
  end

  test "show returns the algorithm diagram" do
    algorithm = Algorithm.create!(user: @user, name: "Legivel", diagram: { "nodes" => [ { "id" => "n7" } ], "edges" => [] })

    get algorithm_url(algorithm), as: :json

    assert_response :success
    assert_equal "Legivel", response.parsed_body["name"]
    assert_equal "n7", response.parsed_body.dig("diagram", "nodes", 0, "id")
  end

  test "show refuses algorithms owned by someone else" do
    algorithm = Algorithm.create!(user: @other, name: "Alheio", diagram: { "nodes" => [], "edges" => [] })

    get algorithm_url(algorithm), as: :json

    assert_response :not_found
  end

  test "destroy removes the algorithm" do
    algorithm = Algorithm.create!(user: @user, name: "Descartavel", diagram: { "nodes" => [], "edges" => [] })

    assert_difference("Algorithm.count", -1) do
      delete algorithm_url(algorithm), as: :json
    end

    assert_response :no_content
  end

  test "destroy refuses algorithms owned by someone else" do
    algorithm = Algorithm.create!(user: @other, name: "Intocavel", diagram: { "nodes" => [], "edges" => [] })

    assert_no_difference("Algorithm.count") do
      delete algorithm_url(algorithm), as: :json
    end

    assert_response :not_found
  end
end
# The save button updates the selected algorithm instead of always creating a
# new one, so the API needs a write path that changes an existing record.
class AlgorithmsUpdateTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    @other = User.create!(login: "aluno-outro", name: "Outro Aluno")
    Algorithm.where(user: [ @user, @other ]).delete_all
    @algorithm = Algorithm.create!(
      user: @user,
      name: "Original",
      diagram: { "nodes" => [ { "id" => "a" } ], "edges" => [] }
    )
  end

  test "update changes the name and the diagram" do
    patch algorithm_url(@algorithm), as: :json,
      params: { name: "Renomeado", diagram: { nodes: [ { id: "b" } ], edges: [] } }

    assert_response :success
    @algorithm.reload
    assert_equal "Renomeado", @algorithm.name
    assert_equal [ "b" ], @algorithm.diagram["nodes"].map { |n| n["id"] }
  end

  test "update does not create a second record" do
    assert_difference -> { Algorithm.where(user: @user).count }, 0 do
      patch algorithm_url(@algorithm), as: :json,
        params: { name: "Renomeado", diagram: { nodes: [], edges: [] } }
    end
  end

  test "update is refused for an algorithm owned by someone else" do
    foreign = Algorithm.create!(user: @other, name: "Secreto",
      diagram: { "nodes" => [], "edges" => [] })

    patch algorithm_url(foreign), as: :json,
      params: { name: "Invadido", diagram: { nodes: [], edges: [] } }

    assert_response :not_found
    assert_equal "Secreto", foreign.reload.name
  end

  test "update rejects a blank name" do
    patch algorithm_url(@algorithm), as: :json,
      params: { name: "", diagram: { nodes: [], edges: [] } }

    assert_response :unprocessable_entity
    assert_equal "Original", @algorithm.reload.name
  end
end

# The name is what identifies an algorithm in the dropdown, so the API has to
# explain the refusal instead of returning a bare 422.
class AlgorithmsNameUniquenessTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.find_or_create_by!(login: "dev") { |user| user.name = "Aluno de Teste" }
    Algorithm.where(user: @user).delete_all
  end

  def diagram
    { nodes: [], edges: [] }
  end

  test "create refuses a name the student already used" do
    post algorithms_url, as: :json,
      params: { name: "Contador", diagram: diagram }
    assert_response :created

    post algorithms_url, as: :json,
      params: { name: "Contador", diagram: diagram }

    assert_response :unprocessable_entity
    assert_match(/já existe/i, response.parsed_body["errors"].join)
  end

  test "create refuses the same name in a different case" do
    Algorithm.create!(user: @user, name: "Contador", diagram: diagram)

    post algorithms_url, as: :json,
      params: { name: "CONTADOR", diagram: diagram }

    assert_response :unprocessable_entity
  end

  test "update refuses a name already used by another algorithm" do
    Algorithm.create!(user: @user, name: "Contador", diagram: diagram)
    other = Algorithm.create!(user: @user, name: "Soma", diagram: diagram)

    patch algorithm_url(other), as: :json,
      params: { name: "Contador", diagram: diagram }

    assert_response :unprocessable_entity
    assert_equal "Soma", other.reload.name
  end

  test "update renaming to a fresh name succeeds" do
    algorithm = Algorithm.create!(user: @user, name: "Contador", diagram: diagram)

    patch algorithm_url(algorithm), as: :json,
      params: { name: "Contador v2", diagram: diagram }

    assert_response :success
    assert_equal "Contador v2", algorithm.reload.name
  end

  test "update keeping the same name succeeds" do
    algorithm = Algorithm.create!(user: @user, name: "Contador", diagram: diagram)

    patch algorithm_url(algorithm), as: :json,
      params: { name: "Contador", diagram: { nodes: [ { id: "a" } ], edges: [] } }

    assert_response :success
  end
end
