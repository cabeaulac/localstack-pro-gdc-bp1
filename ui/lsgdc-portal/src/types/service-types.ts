// IVAuth User
export interface IUser {
  active?: boolean; // is the user logged in now
  disabled: boolean;
  disabled_reason: string;
  email: string;
  email_verified: string;
  failed_logins: number;
  family_name: string;
  force_pw_change: boolean;
  given_name: string;
  id: string;
  last_login: number;
  last_pw_change: number;
  mfa_secret_sent: number;
  mfa_status: string;
  mfa_type: string;
  middle_name: string;
  name: string;
  nickname: string;
  picture: string;
  pw_reset_sent: number;
  source: string; // source of the user. ie PAR0
  type: string;
  updated_at: number;
  username: string; // same as email
}

export interface IAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface IContact {
  id: string,
  rk: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  dob?: Date,
  createDt: string,
  beneficiary: boolean,
  executor: boolean,
  addr: IAddress,
}

// Websocket message to remove a Contact
export interface IIdRk {
  id: string,
  rk: string,
}

export interface IS3User {
  id: string,
  rk: string,
  uid: string,
  prefs: { [key: string]: string },
  contacts: IContact[],
  createDt: string,
}

export interface S3SignedUrlData {
  index: number;
  url: string;
}

export type UploadingStatus = 'pending' | 'uploading' | 'failed' | 'success';

export class UploadableFile {
  public file: File;
  public path: string;
  public id: string;
  public url: string;
  public status: UploadingStatus;
  public percentage: number;
  public message: string;

  constructor(file: File) {
    this.file = file;
    this.path = '';
    this.id = `${file.name}-${file.size}-${file.lastModified}-${file.type}`;
    this.url = URL.createObjectURL(file);
    this.status = 'pending';
    this.percentage = 0;
    this.message = '';
  }
}

export interface IS3Item {
  id: string;
  rk: string;
  s3key: string;
  name: string;
  desc?: string;
  createDt: Date;
  lastModDt: Date;
  size: string;
  tags: string[];
}

