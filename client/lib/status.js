export function getStatusClassName(status) {
  switch (status) {
    case 'open':
      return 'status-pill status-pill--open'
    case 'in_progress':
      return 'status-pill status-pill--progress'
    case 'closed':
      return 'status-pill status-pill--closed'
    default:
      return 'status-pill'
  }
}

export function formatStatusLabel(status) {
  if (status === 'in_progress') {
    return 'In progress'
  }

  return status.replace('_', ' ')
}
