up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

shell:
	docker compose exec app bash

console:
	docker compose exec app bin/rails console

db:
	docker compose exec app bin/rails db:prepare

test:
	docker compose exec app bin/rails test