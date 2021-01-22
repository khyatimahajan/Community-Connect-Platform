// tslint:disable:variable-name
export class UserSignupInfo {
    _id: string;
    name: string;
    EmailID: string;
    username: string;
    bio: string;

    image_src: string;
    email = this.EmailID;
    password: string;
    password_conf: string;
}
