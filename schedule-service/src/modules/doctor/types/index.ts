export interface CreateDoctorCommand {
  name: string;
}

export interface UpdateDoctorCommand {
  id: string;
  name?: string;
}

export interface DoctorPaginationQuery {
  skip?: number;
  take?: number;
}

export interface DoctorPagination {
  skip: number;
  take: number;
}
