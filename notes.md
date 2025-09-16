# Notes

What does this look like ?

- Define a schema with zod
- Define lists of possible params (filters, sorts, search, order)
- Define a function which retrieves this data with the params passed as args
- Define a function which deletes this data
- Define a function which creates this data
- Define a function which updates this data
- Define a function which defines ownership of this data (who can read, write, delete)

What does it do ?

- Explicitly define the structure of the data
- Handles the retrieval of the data
- Handles validation of the data
- Handles ownership of the data
- Exposes CRUD functions to be used by the application
- Exposes OpenAPI schema / Swagger documentation
- Exposes REST API endpoints and/or GraphQL API and/or
- Exposes a web interface for administration

# Development Roadmap

## Phase 1: Core Framework ✅ (Current)
- Entity definition with Zod schemas ✅
- Route generation (GET /entity, GET /entity/:id) ✅
- Type safety throughout ✅
- Context injection (request, server) ✅
- Basic CRUD operations
- Comprehensive testing suite ✅
- CI/CD pipeline ✅
- Tidy up CRUD by separating it in different files ✅
- Custom routes ✅

## Phase 2: Ecosystem
- Authentication middleware
- Validation middleware
- Caching layer
- Rate limiting
- CORS handling
- Error handling standardization
- Request/response middleware

## Phase 3: Developer Tools
- CLI for scaffolding projects
- VS Code extension
- OpenAPI/Swagger documentation generation
- Admin dashboard
- Development server with hot reload
- Testing utilities

## Phase 4: Advanced Features
- Advanced rate limiting
- Monitoring and observability
- Deployment tools
- Horizontal scaling support
- GraphQL integration
- Real-time subscriptions
- Advanced security features
