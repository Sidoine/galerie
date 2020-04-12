import { SingletonLoader } from "folke-service-helpers";
import { computed, action } from "mobx";
import { User, UserPatch } from "../services/views";
import { UserController } from "../services/user";

export class UsersStore {
    constructor(
        private administrator: SingletonLoader<boolean>,
        public usersLoader: SingletonLoader<User[]>,
        private userService: UserController
    ) {}

    @computed
    get isAdministrator() {
        return this.administrator.getValue() || false;
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
