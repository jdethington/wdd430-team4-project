# Feature Specification: WatchList Movie Collection Manager

**Project Title**: WatchList  
**Feature Branch**: `watchlist`  
**Created**: 2026-09-05  
**Status**: Draft  
**Input**: User description: "Create a project specification for WatchList, a web application that helps movie fans organize and manage the movies they want to watch and the movies they have already watched. Users can search for movies using an external API such as the Streaming Availability API by Movie of the Night or TMDB, add them to their personal watchlist, and record ratings and reviews. A personal dashboard will allow users to easily view and manage their movie collection. Include a project title and description, the purpose and target audience, user stories for core workflows including sign up, create, read, update, and delete, acceptance criteria for each story, API endpoints, and implementation priority."

## Project Overview

WatchList is a private web application where movie fans can find movies, save movies they want to watch, track movies they have watched, and record personal ratings and reviews in one organized collection.

### Purpose

WatchList replaces scattered notes and unreliable memory with a searchable, manageable record of a user's movie interests and viewing history. It helps users move from discovery to a personal, up-to-date dashboard with minimal effort.

### Target Audience

The primary audience is individual movie fans who frequently discover films, maintain a personal watchlist, and want to remember their opinions after watching. The initial release supports private personal collections; social sharing, collaborative lists, recommendations, and public reviews are outside scope.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Create an Account (Priority: P1)

As a new movie fan, I want to create a personal account so that my collection and reviews are private and available across sessions.

**Why this priority**: Authentication is required before personal movie data can be stored safely.

**Independent Test**: Submit valid registration details, sign in with the new account, and confirm that an empty personal dashboard is displayed.

**Acceptance Scenarios**:

1. **Given** a visitor has no account, **When** they submit a unique valid email address and a valid password, **Then** an account is created and they are signed in.
2. **Given** an email address is already registered, **When** a visitor attempts to register with it, **Then** no duplicate account is created and a clear error is shown.
3. **Given** registration fields are invalid or incomplete, **When** the visitor submits the form, **Then** field-level errors identify what must be corrected and no account is created.

---

### User Story 2 - Create a Watchlist Entry (Priority: P1)

As a signed-in movie fan, I want to search for a movie and add it to my "Want to Watch" collection so that I can remember what I want to watch next.

**Why this priority**: Saving a movie is the primary value of the product and enables the rest of the collection workflow.

**Independent Test**: Search for a known movie, add one result, and verify that it appears in the user's watchlist with its available details.

**Acceptance Scenarios**:

1. **Given** a signed-in user is searching, **When** they submit a non-empty title or keyword, **Then** matching results display a title, release year when available, and an add action.
2. **Given** a movie is not in the user's collection, **When** the user selects add, **Then** exactly one watchlist entry is created and displayed.
3. **Given** a movie is already in the user's collection, **When** the user views its search result, **Then** its current status is shown and another entry is not created.

---

### User Story 3 - Read the Personal Dashboard (Priority: P1)

As a signed-in movie fan, I want to view my "Want to Watch," "Watched," and "Want to Rewatch" movies in a dashboard so that I can understand and manage my collection quickly.

**Why this priority**: The dashboard is the central read experience and provides immediate value after a movie is saved.

**Independent Test**: Sign in with a user who has collection entries and verify that the "Want to Watch," "Watched," and "Want to Rewatch" categories display only that user's movies, ratings, and reviews.

**Acceptance Scenarios**:

1. **Given** a signed-in user has collection entries, **When** they open the dashboard, **Then** only their own entries are displayed in the appropriate "Want to Watch," "Watched," or "Want to Rewatch" category with title, rating when present, and review when present.
2. **Given** a signed-in user has no entries, **When** they open the dashboard, **Then** a helpful empty state explains how to search for and add a movie.
3. **Given** dashboard data is loading or unavailable, **When** the user opens the dashboard, **Then** a loading or retryable error state is shown instead of misleading empty data.

---

### User Story 4 - Update a Movie Entry (Priority: P2)

As a signed-in movie fan, I want to move a movie among "Want to Watch," "Watched," and "Want to Rewatch" and edit its rating or review so that my collection reflects my viewing plans and experience.

**Why this priority**: Updating entries turns a watchlist into a useful record of completed viewing and personal opinions.

**Independent Test**: Open one owned entry, change its watched status, rating, and review, reload the dashboard, and verify that the changes persist.

**Acceptance Scenarios**:

1. **Given** a user owns a "Want to Watch" entry, **When** they mark it as watched, **Then** it moves to the "Watched" category.
2. **Given** a user owns a "Watched" entry, **When** they mark it as "Want to Rewatch," **Then** it moves to the "Want to Rewatch" category without deleting its rating or review.
3. **Given** a user owns a "Watched" or "Want to Rewatch" entry, **When** they move it back to "Want to Watch," **Then** its category changes without creating a duplicate entry.
4. **Given** a user owns a watched entry, **When** they enter a whole-number rating from 1 through 5 and an optional review, **Then** both values are saved and displayed.
5. **Given** a rating is outside the allowed range or a review exceeds 2,000 characters, **When** the user saves, **Then** validation explains the error and previous values remain unchanged.
6. **Given** a user attempts to update another user's entry, **When** the request is submitted, **Then** it is rejected and no data is changed.

---

### User Story 5 - Delete a Movie Entry (Priority: P2)

As a signed-in movie fan, I want to remove a movie from my collection so that my dashboard stays accurate and uncluttered.

**Why this priority**: Deletion completes the core collection lifecycle and gives users control over unwanted entries.

**Independent Test**: Delete an owned entry, confirm it no longer appears, and verify that an unrelated user's entry is unaffected.

**Acceptance Scenarios**:

1. **Given** a user owns a collection entry, **When** they confirm deletion, **Then** the entry, rating, and review are removed from their dashboard.
2. **Given** a user opens the delete action, **When** they cancel, **Then** the entry remains intact.
3. **Given** a user attempts to delete another user's entry, **When** the request is submitted, **Then** it is rejected and the other user's data remains unchanged.

### Edge Cases

- Blank or whitespace-only searches are rejected without calling the movie information service.
- Searches with no matches show a clear empty result and do not change the collection.
- Repeated add requests for the same movie leave exactly one entry for that user.
- Movies missing a poster, release date, or summary remain addable with the details that are available.
- Movie service timeouts, rate limits, or outages show a retryable error and do not create partial collection data.
- Expired or missing authentication prevents protected reads and mutations and directs the user to sign in.
- Attempts to access, update, or delete another user's entry are denied without revealing its data.
- Refreshing after an update or deletion shows the persisted result rather than stale data.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST allow a visitor to create an account with a unique email address and valid password.
- **FR-002**: The system MUST authenticate registered users and protect personal collection data from unauthenticated access.
- **FR-003**: The system MUST allow an authenticated user to search a selected movie information service by title or keyword.
- **FR-004**: Search results MUST display available movie details, including title and release year when available, and identify whether each movie is already in the user's collection.
- **FR-005**: The system MUST allow an authenticated user to add one watchlist entry for a movie and prevent duplicate entries for that user and movie.
- **FR-006**: The system MUST allow an authenticated user to read their own "Want to Watch," "Watched," and "Want to Rewatch" entries, ratings, and reviews from the dashboard.
- **FR-007**: The system MUST allow an authenticated user to move an entry they own among the "Want to Watch," "Watched," and "Want to Rewatch" categories and update its rating or review.
- **FR-008**: The system MUST validate ratings as whole numbers from 1 through 5 and reviews as optional text no longer than 2,000 characters.
- **FR-009**: The system MUST allow an authenticated user to delete an entry they own, including its associated rating and review.
- **FR-010**: The system MUST enforce ownership checks on every protected collection read, create, update, and delete operation.
- **FR-011**: The system MUST provide loading, empty, validation-error, service-error, and retry states for search and dashboard workflows.
- **FR-012**: The system MUST preserve existing collection data when the external movie information service is unavailable.
- **FR-013**: The system MUST safely validate and render user-entered reviews and externally sourced movie data.
- **FR-014**: The system MUST provide keyboard-accessible controls, meaningful labels, visible focus states, and sufficient color contrast for core workflows.

### API Endpoints

The following resource-oriented endpoints define the initial application contract. Protected endpoints require an authenticated user and enforce ownership where applicable.

| Method | Endpoint                       | Priority | Purpose                                                                   |
| ------ | ------------------------------ | -------- | ------------------------------------------------------------------------- |
| POST   | `/api/auth/signup`             | P1       | Create an account and establish an authenticated session                  |
| POST   | `/api/auth/signin`             | P1       | Authenticate an existing user                                             |
| POST   | `/api/auth/signout`            | P1       | End the current authenticated session                                     |
| GET    | `/api/movies/search?q={query}` | P1       | Search the selected external movie information service                    |
| GET    | `/api/watchlist`               | P1       | Read the authenticated user's collection, optionally filtered by category |
| POST   | `/api/watchlist`               | P1       | Add a movie to the authenticated user's collection                        |
| GET    | `/api/watchlist/{itemId}`      | P1       | Read one owned collection entry                                           |
| PATCH  | `/api/watchlist/{itemId}`      | P2       | Update category, rating, or review on an owned entry                      |
| DELETE | `/api/watchlist/{itemId}`      | P2       | Delete an owned collection entry and its personal metadata                |

API responses MUST provide clear validation errors for invalid input, an authorization error for unauthorized access, a not-found error for missing entries, and a retryable service error when movie search is unavailable. Exact response fields will be defined during planning.

### Implementation Priority

1. **P1 - Foundation and primary value**: Account creation and authentication, movie search, adding movies, and the personal dashboard read experience.
2. **P2 - Collection lifecycle**: Marking movies watched, recording ratings and reviews, editing entries, and deleting entries.
3. **P3 - Hardening and usability**: Comprehensive loading and error states, accessibility validation, service-failure handling, and end-to-end regression coverage.

### Assumptions

- The initial release will use an internal API backed by a seeded movie catalog in the application database for search and movie metadata. After the internal API is working, it will integrate with the Streaming Availability API by Movie of the Night; TMDB will be integrated afterward.
- The initial release will authenticate users with email and password; social login is out of scope.
- The selected service provides a stable external movie identifier and enough metadata to identify a movie; missing optional details will not prevent saving it.
- A collection entry stores the movie details needed for the dashboard so existing entries remain understandable if external metadata changes.
- Each collection entry has exactly one category: "Want to Watch," "Watched," or "Want to Rewatch." Category changes are reversible and do not create duplicate entries.
- Ratings and reviews are private personal records in the initial release.
- Account recovery, social features, recommendations, collaborative lists, and imports are outside the initial release.

### Key Entities _(include if feature involves data)_

- **User**: A person with an authenticated account and ownership of a private collection.
- **Movie**: An externally sourced movie identified by a stable provider identifier, title, release year when available, poster when available, and summary when available.
- **WatchlistEntry**: A user's relationship to one movie, including one category ("Want to Watch," "Watched," or "Want to Rewatch"), creation date, rating, and review. A user may have at most one entry for a movie.
- **Rating**: An optional whole-number personal score from 1 through 5 associated with a watched entry.
- **Review**: Optional user-authored text of no more than 2,000 characters associated with a watched entry.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: At least 90% of first-time users can complete account creation and reach their empty dashboard in under 2 minutes during usability testing.
- **SC-002**: At least 95% of valid searches show results, a clear empty state, or a clear retryable error within 3 seconds under normal service conditions.
- **SC-003**: At least 90% of users can find and add a movie to their watchlist on their first attempt during usability testing.
- **SC-004**: At least 90% of usability-test participants can locate their watchlist, watched movies, and saved review from the dashboard without assistance.
- **SC-005**: At least 95% of collection updates and deletions remain correct after a page refresh in end-to-end testing.
- **SC-006**: 100% of tested unauthorized collection access, update, and delete attempts are denied without exposing another user's movie data.

## Clarifications

### Session 2026-09-05

- Q: Which movie information provider should the implementation use first? -> A: Use an internal movie API for the initial release, then implement the Streaming Availability API by Movie of the Night, followed by TMDB.
- Q: Which authentication method should the initial release use? -> A: Email and password authentication.
- Q: What should provide movie data for the initial internal API? -> A: A seeded movie catalog stored in the application database.
- Q: Should watched status be reversible, and should there be an additional category? -> A: Category changes are reversible, with "Want to Watch," "Watched," and "Want to Rewatch" as the three collection categories.
