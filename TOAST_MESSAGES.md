# Toast Messages Documentation

This document lists all toast messages used throughout the application for consistency and easy reference.

---

## Ticket Purchase Page (`ticket-buy.ts`)

### Success Messages ✅

| Message                                | Trigger                        |
| -------------------------------------- | ------------------------------ |
| `Coupon applied: {X}% discount`        | Valid coupon code applied      |
| `Added {qty} {type} ticket(s) to cart` | Tickets added to cart          |
| `Payment successful!`                  | Payment completed via Midtrans |
| `Added to waitlist for {type}`         | Successfully joined waitlist   |

### Warning Messages ⚠️

| Message                                         | Trigger                                    |
| ----------------------------------------------- | ------------------------------------------ |
| `Maximum {X} seat(s) allowed`                   | Trying to select more seats than purchased |
| `You haven't purchased any {category} tickets.` | Selecting seat in unpurchased category     |
| `You only have {X} {category} ticket(s).`       | Exceeded purchased quantity for category   |
| `Please enter a coupon code`                    | Empty coupon code submitted                |
| `Only {X} more ticket(s) available`             | Increment beyond remaining stock           |
| `All available {type} tickets are in your cart` | All tickets already in cart                |
| `Only {X} more {type} ticket(s) available`      | Exceeded available quantity                |
| `Please login to purchase tickets`              | Unauthenticated purchase attempt           |
| `Payment already in progress...`                | Double payment submission attempt          |

### Error Messages ❌

| Message                                                 | Trigger                          |
| ------------------------------------------------------- | -------------------------------- |
| `Invalid coupon code`                                   | Invalid/expired coupon           |
| `Failed to validate coupon`                             | API error validating coupon      |
| `Not enough tickets available`                          | Insufficient stock               |
| `Purchase failed`                                       | General purchase failure         |
| `All available {type} tickets are already in your cart` | Cart at max capacity             |
| `Only {X} more {type} ticket(s) available`              | Exceeding available tickets      |
| `Failed to create booking`                              | API booking error                |
| `Booking failed. Please try again.`                     | Booking submission error         |
| `Failed to create payment`                              | Midtrans payment creation failed |
| `Payment failed. Please try again.`                     | Payment processing error         |
| `{result.message}`                                      | Dynamic error from waitlist API  |
| `Failed to join waitlist`                               | Waitlist API error               |

### Info Messages ℹ️

| Message                                          | Trigger                  |
| ------------------------------------------------ | ------------------------ |
| `Payment pending. Please complete your payment.` | Payment in pending state |

---

## Event Creation Page (`create-event.ts`)

### Success Messages ✅

| Message                       | Trigger           |
| ----------------------------- | ----------------- |
| `Event updated successfully!` | Event edit saved  |
| `Event created successfully!` | New event created |

### Warning Messages ⚠️

| Message                                                              | Trigger                    |
| -------------------------------------------------------------------- | -------------------------- |
| `Total number of tickets exceeds available seats in this section...` | Section capacity exceeded  |
| `Ticket type already exists`                                         | Duplicate ticket type name |

### Error Messages ❌

| Message                               | Trigger                  |
| ------------------------------------- | ------------------------ |
| `Please complete all required fields` | Form validation failed   |
| `Failed to update event`              | Event update API error   |
| `Failed to create event`              | Event creation API error |

---

## Toast Service Types

The `ToastService` supports the following toast types:

```typescript
toast.success(message: string)  // Green - positive actions
toast.warning(message: string)  // Yellow - caution/validation
toast.error(message: string)    // Red - errors/failures
toast.info(message: string)     // Blue - informational
```

---

## Best Practices

1. **Keep messages concise** - Under 60 characters when possible
2. **Use dynamic values** - Include specific context (ticket type, quantity, etc.)
3. **Match severity to action** - Success for completions, Warning for validations, Error for failures
4. **Avoid technical jargon** - User-friendly language only
