export type Participant = {
  id: number
  firstName: string
  lastName: string
  nickname: string
  birthday: string | null;
  membershipStatus: string
  participantType: string
  isTemporary: boolean
  createdAt: string
  updatedAt: string
}