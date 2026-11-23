/** The identifier shown to people: warehouse-district-order, for example 2-5-3001. */
export function orderIdentifier(order) {
  return `${order.warehouseId}-${order.districtId}-${order.orderId}`
}

/** True when the end day is not before the start day. A range with an empty end is always valid. */
export function isRangeValid(from, to) {
  return !from || !to || to >= from
}
