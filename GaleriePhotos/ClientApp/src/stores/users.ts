import { SingletonLoader } from "folke-service-helpers";
import { computed, action } from "mobx";
import { User, UserPatch } from "../services/views";
import { UserController } from "../services/user";
import { AuthorizeService } from "./authorize";

export class UsersStore {
    constructor(
        private administrator: SingletonLoader<boolean>,
        public usersLoader: SingletonLoader<User[]>,
        private userService: UserController,
        private authorize: AuthorizeService
    ) {}

    @computed
    get isAdministrator() {
        return (
            (this.authorize.authenticated && this.administrator.getValue()) ||
            false
        );
    }

    @action
    patch(user: User, patch: UserPatch) {
        if (patch.administrator !== undefined) {
            user.administrator = patch.administrator;
        }
        if (patch.directoryVisibility !== undefined) {
            user.directoryVisibility = patch.directoryVisibility;
        }

        this.userService.patch(user.id, patch);
    }
}
