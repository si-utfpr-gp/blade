require "test_helper"

# A public link is a token the owner turns on, not the record's id, so links
# cannot be guessed by counting. Turning it off kills the link for good.
class AlgorithmSharingTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(login: "dono@utfpr.edu.br", name: "Dono")
    @algorithm = @user.algorithms.create!(name: "Soma", diagram: { "nodes" => [], "edges" => [] })
  end

  test "starts without a public link" do
    assert_nil @algorithm.share_token
    assert_not @algorithm.shared?
  end

  test "sharing creates a long random token" do
    @algorithm.share!

    assert @algorithm.reload.shared?
    assert_operator @algorithm.share_token.length, :>=, 20
    assert_match(/\A[A-Za-z0-9_-]+\z/, @algorithm.share_token)
  end

  # The link already pasted in a page must keep working.
  test "sharing again keeps the same link" do
    @algorithm.share!
    token = @algorithm.share_token

    @algorithm.share!

    assert_equal token, @algorithm.reload.share_token
  end

  test "each algorithm gets its own token" do
    other = @user.algorithms.create!(name: "Outro", diagram: { "nodes" => [], "edges" => [] })

    @algorithm.share!
    other.share!

    assert_not_equal @algorithm.share_token, other.share_token
  end

  test "unsharing removes the link, and sharing again makes a new one" do
    @algorithm.share!
    old = @algorithm.share_token

    @algorithm.unshare!
    assert_not @algorithm.reload.shared?

    @algorithm.share!
    assert_not_equal old, @algorithm.share_token
  end

  test "finds a shared algorithm by its token only" do
    @algorithm.share!

    assert_equal @algorithm, Algorithm.find_shared(@algorithm.share_token)
    assert_nil Algorithm.find_shared("inventado")
    assert_nil Algorithm.find_shared("")
    assert_nil Algorithm.find_shared(nil)
  end
end
