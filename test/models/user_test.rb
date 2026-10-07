require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "requires a unique login" do
    User.create!(login: "aluno1", name: "Aluno Um")
    duplicate = User.new(login: "aluno1", name: "Outro Aluno")

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:login], "has already been taken"
  end

  test "requires a name" do
    user = User.new(login: "aluno2")

    assert_not user.valid?
    assert_includes user.errors[:name], "can't be blank"
  end

  test "builds from an ldap entry" do
    entry = Struct.new(:uid, :cn, :mail, :uidnumber).new(
      "12345", "Maria Souza", "maria@utfpr.edu.br", "12345"
    )

    user = User.from_ldap(entry)

    assert_equal "12345", user.login
    assert_equal "Maria Souza", user.name
    assert_equal "maria@utfpr.edu.br", user.ldap_email
    assert_equal "12345", user.ldap_uid
  end

  test "finds or creates the development user" do
    dev = User.dev_user

    assert_equal "dev", dev.login
    assert_equal User.dev_user.id, dev.id
  end
end