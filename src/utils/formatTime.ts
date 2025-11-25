function formatTime(date: Date) {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'

  // Convert hours to 12-hour format, where 0 becomes 12
  hours = hours % 12
  hours = hours ? hours : 12

  // Pad minutes with a leading zero if needed
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes

  return `${hours}:${formattedMinutes} ${ampm}`
}

export default formatTime
