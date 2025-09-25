/**
 * Utility functions for age calculation
 */

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculate age from date of birth string
 * @param dateOfBirthString - Date of birth as string
 * @returns Age in years or null if invalid date
 */
export function calculateAgeFromString(dateOfBirthString: string | null): number | null {
  if (!dateOfBirthString) return null;
  
  try {
    const dateOfBirth = new Date(dateOfBirthString);
    if (isNaN(dateOfBirth.getTime())) return null;
    
    return calculateAge(dateOfBirth);
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}
