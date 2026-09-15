export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The request is valid but conflicts with current state (already joined, match started, ...). */
export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class MatchFullError extends ConflictError {
  constructor(message = "This match is full") {
    super(message);
    this.name = "MatchFullError";
  }
}

/** Host tried to charge an entry fee before finishing Stripe onboarding. */
export class PayoutsNotReadyError extends ConflictError {
  constructor(
    message = "Set up payouts before hosting a paid match",
  ) {
    super(message);
    this.name = "PayoutsNotReadyError";
  }
}
