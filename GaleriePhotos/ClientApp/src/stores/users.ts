import { SingletonLoader } from "folke-service-helpers";
import {
    computed,
    action,
    makeObservable,
    observable,
    runInAction,
} from "mobx";
import { User, UserPatch, GalleryMember } from "../services/views";
import { UserController } from "../services/user";
import { DirectoryVisibility } from "../services/enums";

export class UsersStore {
    memberships: GalleryMember[] | null = null;
    loadingMemberships = false;
    selectedUser: User | null = null;

    constructor(
        private administrator: SingletonLoader<boolean>,
        public usersLoader: SingletonLoader<User[]>,
        private userService: UserController
    ) {
        makeObservable(this, {
            memberships: observable.ref,
            loadingMemberships: observable,
            selectedUser: observable,
            selectUser: action,
            setMembershipAdmin: action,
            setMembershipVisibility: action,
            isAdministrator: computed,
            patch: action,
        });
    }

    get isAdministrator() {
        return this.administrator.getValue() || false;
    }

    patch(user: User, patch: UserPatch) {
        if (patch.administrator !== undefined) {
            user.administrator = patch.administrator;
        }

        this.userService.patch(user.id, patch);
    }

    selectUser(user: User | null) {
        this.selectedUser = user;
        if (user) {
            this.loadMemberships(user.id);
        } else {
            this.memberships = null;
        }
    }

    async loadMemberships(userId: string) {
        this.loadingMemberships = true;
        try {
            const result = (await this.userService.getUserGalleries(
                userId
            )) as unknown as GalleryMember[]; // cast défensif
            runInAction(() => (this.memberships = result));
        } finally {
            runInAction(() => (this.loadingMemberships = false));
        }
    }

    async setMembershipAdmin(membership: GalleryMember, isAdmin: boolean) {
        membership.isAdministrator = isAdmin;
        await this.userService.updateUserGalleryMembership(
            membership.userId,
            membership.galleryId,
            { isAdministrator: isAdmin }
        );
    }

    async setMembershipVisibility(
        membership: GalleryMember,
        directoryVisibility: DirectoryVisibility
    ) {
        membership.directoryVisibility = directoryVisibility;
        await this.userService.updateUserGalleryMembership(
            membership.userId,
            membership.galleryId,
            { directoryVisibility }
        );
    }

    async addMembership(
        user: User,
        galleryId: number,
        visibility: DirectoryVisibility,
        isAdministrator: boolean
    ) {
        const created = (await this.userService.addUserToGallery(
            user.id,
            galleryId,
            {
                directoryVisibility: visibility,
                isAdministrator,
            }
        )) as unknown as GalleryMember;
        if (this.memberships) {
            this.memberships = [...this.memberships, created];
        } else {
            this.memberships = [created];
        }
    }
}
