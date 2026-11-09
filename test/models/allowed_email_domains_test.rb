require "test_helper"

class AllowedEmailDomainsTest < ActiveSupport::TestCase
  # The university's real domains are not known yet, so the list is configured
  # through the environment and an empty list allows any account. That keeps
  # testing possible today and turning the list on later a config change.
  setup do
    @original = ENV["GOOGLE_ALLOWED_DOMAINS"]
    User.delete_all
  end

  teardown do
    ENV["GOOGLE_ALLOWED_DOMAINS"] = @original
  end

  def with_domains(value)
    ENV["GOOGLE_ALLOWED_DOMAINS"] = value
    User::AllowedEmailDomains.clear_cache!
  end

  def auth(email, uid: "1", verified: true)
    {
      "provider" => "google_oauth2",
      "uid" => uid,
      "info" => { "email" => email, "name" => "Ana", "image" => nil },
      "extra" => { "raw_info" => { "email_verified" => verified } }
    }
  end

  test "accepts any account when no domain is configured" do
    with_domains(nil)

    user = User.from_google(auth("alguem@gmail.com"))

    assert_equal "alguem@gmail.com", user.login
  end

  test "accepts an address on a configured domain" do
    with_domains("utfpr.edu.br")

    user = User.from_google(auth("aluno@utfpr.edu.br"))

    assert_equal "aluno@utfpr.edu.br", user.login
  end

  test "refuses an address outside the configured domains" do
    with_domains("utfpr.edu.br")

    assert_raises(User::DomainNotAllowed) do
      User.from_google(auth("estranho@gmail.com"))
    end

    assert_equal 0, User.count
  end

  test "accepts any of several configured domains" do
    with_domains("utfpr.edu.br, alunos.utfpr.edu.br")

    assert User.from_google(auth("aluno@utfpr.edu.br"))
    assert User.from_google(auth("aluno@alunos.utfpr.edu.br"))
  end

  # Google Workspace addresses arrive capitalised often enough that a naive
  # comparison would lock real students out.
  test "compares domains case insensitively" do
    with_domains("UTFPR.edu.br")

    assert User.from_google(auth("Aluno@utfpr.edu.br"))
  end

  test "ignores surrounding whitespace in the configuration" do
    with_domains(" utfpr.edu.br , alunos.utfpr.edu.br ")

    assert User.from_google(auth("aluno@alunos.utfpr.edu.br"))
  end

  test "an empty value behaves like no list configured" do
    with_domains("")

    assert User.from_google(auth("qualquer@gmail.com"))
  end

  # UTFPR students sign in as @alunos.utfpr.edu.br, so a configured domain
  # covers its subdomains: listing utfpr.edu.br lets in anyone from UTFPR.
  test "accepts the subdomains of a configured domain" do
    with_domains("utfpr.edu.br")

    assert User.from_google(auth("aluno@alunos.utfpr.edu.br", uid: "1"))
    assert User.from_google(auth("prof@professores.utfpr.edu.br", uid: "2"))
  end

  test "allowed? accepts the domain and its subdomains only" do
    with_domains("utfpr.edu.br")

    assert User::AllowedEmailDomains.allowed?("ana@utfpr.edu.br")
    assert User::AllowedEmailDomains.allowed?("ana@alunos.utfpr.edu.br")
    assert User::AllowedEmailDomains.allowed?("ana@ALUNOS.UTFPR.EDU.BR")
  end

  # A domain that merely ends with the same letters, or that carries the real
  # one as a prefix, belongs to someone else.
  test "refuses look-alike domains" do
    with_domains("utfpr.edu.br")

    %w[
      ana@fakeutfpr.edu.br
      ana@utfpr.edu.br.golpe.com
      ana@utfpr.edu.brx
      ana@gmail.com
      ana@
      ana
    ].each do |email|
      assert_not User::AllowedEmailDomains.allowed?(email), "#{email} não deveria passar"
    end
  end

  # The message reaches the login screen, so it must not echo the address back.
  test "the refusal does not leak the email address" do
    with_domains("utfpr.edu.br")

    error = assert_raises(User::DomainNotAllowed) do
      User.from_google(auth("alguem@gmail.com"))
    end

    assert_no_match(/alguem@gmail\.com/, error.message)
  end

  test "a refused account leaves no row behind" do
    with_domains("utfpr.edu.br")

    assert_raises(User::DomainNotAllowed) do
      User.from_google(auth("estranho@gmail.com", uid: "999"))
    end

    assert_nil User.find_by(provider_uid: "999")
  end
end
