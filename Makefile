.PHONY: dev dev-build prod prod-build down logs logs-backend logs-frontend \
        prisma-migrate prisma-seed prisma-reset prisma-studio clean help

# Development

## Start development environment
dev:
	docker compose up -d
	@echo ""
	@echo "✅ Development environment started!"
	@echo "   Frontend:      http://localhost:3000"
	@echo "   Backend API:   http://localhost:3001/api/v1"
	@echo "   Prisma Studio: http://localhost:5555"
	@echo "   PostgreSQL:    localhost:5432"
	@echo "   Redis:         localhost:6379"
	@echo ""

## Rebuild and start development environment
dev-build:
	docker compose up -d --build
	@echo ""
	@echo "✅ Development environment rebuilt and started!"
	@echo ""

## Start only infrastructure (Postgres + Redis)
infra:
	docker compose up -d postgres redis
	@echo ""
	@echo "✅ Infrastructure started (Postgres + Redis)"
	@echo ""

# Production

## Start production environment
prod:
	docker compose -f docker-compose.prod.yml up -d
	@echo ""
	@echo "✅ Production environment started!"
	@echo ""

## Rebuild and start production environment
prod-build:
	docker compose -f docker-compose.prod.yml up -d --build
	@echo ""
	@echo "✅ Production environment rebuilt and started!"
	@echo ""

# Control

## Stop all containers (dev)
down:
	docker compose down
	@echo "✅ Development containers stopped."

## Stop all containers (prod)
down-prod:
	docker compose -f docker-compose.prod.yml down
	@echo "✅ Production containers stopped."

## Restart backend service
restart-backend:
	docker compose restart backend
	@echo "✅ Backend restarted."

## Restart frontend service
restart-frontend:
	docker compose restart frontend
	@echo "✅ Frontend restarted."

# Logs

## Tail all logs
logs:
	docker compose logs -f

## Tail backend logs
logs-backend:
	docker compose logs -f backend

## Tail frontend logs
logs-frontend:
	docker compose logs -f frontend

## Tail database logs
logs-db:
	docker compose logs -f postgres

# Prisma

## Run Prisma migrations
prisma-migrate:
	docker compose exec backend pnpm prisma migrate dev
	@echo "✅ Migrations applied."

## Deploy Prisma migrations (production)
prisma-deploy:
	docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
	@echo "✅ Migrations deployed."

## Seed the database
prisma-seed:
	docker compose exec backend pnpm prisma:seed
	@echo "✅ Database seeded."

## Reset the database (WARNING: destructive)
prisma-reset:
	@echo "⚠️  This will delete all data! Press Ctrl+C to cancel."
	@sleep 3
	docker compose exec backend pnpm prisma migrate reset --force
	@echo "✅ Database reset."

## Generate Prisma client
prisma-generate:
	docker compose exec backend pnpm prisma generate
	@echo "✅ Prisma client generated."

# Shell Access

## Open shell in backend container
shell-backend:
	docker compose exec backend sh

## Open shell in frontend container
shell-frontend:
	docker compose exec frontend sh

## Open psql shell
shell-db:
	docker compose exec postgres psql -U $${POSTGRES_USER:-kamorina} -d $${POSTGRES_DB:-kamorina_db}

## Open redis-cli
shell-redis:
	docker compose exec redis redis-cli

# Cleanup

## Remove all containers and volumes (WARNING: deletes data)
clean:
	@echo "⚠️  This will remove all containers, volumes, and data!"
	@echo "   Press Ctrl+C to cancel."
	@sleep 3
	docker compose down -v --rmi local
	@echo "✅ Cleaned up."

## Remove all containers, volumes, and images
clean-all:
	@echo "⚠️  This will remove EVERYTHING including built images!"
	@sleep 3
	docker compose down -v --rmi all
	docker compose -f docker-compose.prod.yml down -v --rmi all 2>/dev/null || true
	@echo "✅ Full cleanup complete."

# Status

## Show running containers
ps:
	docker compose ps

## Show running containers (prod)
ps-prod:
	docker compose -f docker-compose.prod.yml ps

# Help

## Show this help
help:
	@echo ""
	@echo "Kamorina Docker Commands:"
	@echo "========================="
	@echo ""
	@echo "  Development:"
	@echo "    make dev              Start development environment"
	@echo "    make dev-build        Rebuild and start development"
	@echo "    make infra            Start only Postgres + Redis"
	@echo ""
	@echo "  Production:"
	@echo "    make prod             Start production environment"
	@echo "    make prod-build       Rebuild and start production"
	@echo ""
	@echo "  Control:"
	@echo "    make down             Stop dev containers"
	@echo "    make down-prod        Stop prod containers"
	@echo "    make restart-backend  Restart backend service"
	@echo "    make restart-frontend Restart frontend service"
	@echo ""
	@echo "  Logs:"
	@echo "    make logs             Tail all logs"
	@echo "    make logs-backend     Tail backend logs"
	@echo "    make logs-frontend    Tail frontend logs"
	@echo "    make logs-db          Tail database logs"
	@echo ""
	@echo "  Prisma:"
	@echo "    make prisma-migrate   Run dev migrations"
	@echo "    make prisma-deploy    Deploy migrations (prod)"
	@echo "    make prisma-seed      Seed database"
	@echo "    make prisma-reset     Reset database (destructive)"
	@echo "    make prisma-generate  Generate Prisma client"
	@echo ""
	@echo "  Shell:"
	@echo "    make shell-backend    Open backend shell"
	@echo "    make shell-frontend   Open frontend shell"
	@echo "    make shell-db         Open psql shell"
	@echo "    make shell-redis      Open redis-cli"
	@echo ""
	@echo "  Cleanup:"
	@echo "    make clean            Remove containers + volumes"
	@echo "    make clean-all        Remove everything"
	@echo ""
	@echo "  Status:"
	@echo "    make ps               Show running containers"
	@echo ""
