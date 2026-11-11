# Security Specification for Nova Commerce

## 1. Data Invariants

1. **Catalog Integrity**: Only verified administrators can create, update, or delete Products and StoreSettings. Product catalog is publicly readable by all store visitors.
2. **Order Authenticity & Ownership**: An order's `userId` must strictly match `request.auth.uid`. A customer cannot place an order on behalf of another user ID.
3. **Order Status Gate**: Regular customers can only cancel their own order when status is 'pending'. They cannot mark their own orders as 'delivered' or modify items/prices after creation. Admins have oversight to change order fulfillment status.
4. **Order Read Protection**: Customers can only list and get their own orders (`resource.data.userId == request.auth.uid`). Public users cannot view orders. Admins can view all orders.
5. **Review Integrity**: Any signed-in user can submit a review for a product, but their `userId` must match `request.auth.uid`, rating must be between 1 and 5, and reviews are publicly readable.
6. **Store Settings Protection**: Store configuration (`/settings/general`) is readable by all visitors but modifiable strictly by verified store admins.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)

1. **Payload 1 (Ghost Field Product Injection)**: Non-admin attempt to create product.
2. **Payload 2 (Catalog Deletion Attack)**: Anonymous user attempt to delete a product.
3. **Payload 3 (Spoofed Order Owner)**: Authenticated user `alice` creating an order with `userId: "bob"`.
4. **Payload 4 (Unauthenticated Order Read)**: Unauthenticated visitor attempting to read `/orders/order_123`.
5. **Payload 5 (Cross-Customer Order Stealing)**: Authenticated user `charlie` attempting to read order belonging to `alice`.
6. **Payload 6 (Price Tampering / Status Hijack)**: Customer updating order status to 'delivered' or altering `total`.
7. **Payload 7 (Junk ID Poisoning)**: Creating an order with a 2KB junk character path variable.
8. **Payload 8 (Malformed Negative Price)**: Admin or attacker inserting product with negative price or non-number price.
9. **Payload 9 (Fake Review Author)**: User creating review claiming to be another user ID (`userId: "victim"`).
10. **Payload 10 (Review Rating Overflow)**: Creating review with `rating: 99` outside the 1-5 range.
11. **Payload 11 (Settings Hijack)**: Regular user modifying store payment details or currency settings in `/settings/general`.
12. **Payload 12 (Shadow Field Injection on Order)**: Placing order with ghost privilege fields like `role: "admin"` or `isPaid: true`.
