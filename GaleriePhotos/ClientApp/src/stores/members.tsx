import { useApiClient, ValueLoader } from "folke-service-helpers";
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from "mobx";
import { User, GalleryMember } from "../services/views";
import { UserController } from "../services/user";
import { createContext, useContext, useMemo } from "react";
import { useDirectoriesStore } from "./directories";
import { UsersStore, useUsersStore } from "./users";

class MembersStore {
    memberships: GalleryMember[] | null = null;
    loadingMemberships = false;

    constructor(
        private userService: UserController,
        public galleryId: number,
        public membersLoader: ValueLoader<GalleryMember[], [number]>,
        private userStore: UsersStore
    ) {
        makeObservable(this, {
            memberships: observable.ref,
            loadingMemberships: observable,
            setMembershipAdmin: action,
            setMembershipVisibility: action,
            members: computed,
            administrator: computed,
            member: computed,
        });
    }

    get members() {
        return this.membersLoader.getValue(this.galleryId) || [];
    }

    get member() {
        return this.members.find((x) => x.userId === this.userStore.me?.id);
    }

    get administrator() {
        return this.member?.isAdministrator || false;
    }

    async loadMemberships(userId: string) {
        this.loadingMemberships = true;
        try {
            const result = await this.userService.getUserGalleries(userId);
            if (result.ok) {
                runInAction(() => (this.memberships = result.value));
            }
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
        directoryVisibility: number
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
        visibility: number,
        isAdministrator: boolean
    ) {
        const created = await this.userService.addUserToGallery(
            user.id,
            this.galleryId,
            {
                directoryVisibility: visibility,
                isAdministrator,
            }
        );
        if (created.ok) {
            if (this.memberships) {
                this.memberships = [...this.memberships, created.value];
            } else {
                this.memberships = [created.value];
            }
        }
    }
}

const MembersStoreContext = createContext<MembersStore | null>(null);

export function MembersStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { galleryId } = useDirectoriesStore();
    const apiClient = useApiClient();
    const usersStore = useUsersStore();
    const store = useMemo(() => {
        const userService = new UserController(apiClient);
        const galleryMembersLoader = new ValueLoader(
            userService.getGalleryMembers
        );
        return new MembersStore(
            userService,
            galleryId,
            galleryMembersLoader,
            usersStore
        );
    }, [apiClient, galleryId, usersStore]);
    return (
        <MembersStoreContext.Provider value={store}>
            {children}
        </MembersStoreContext.Provider>
    );
}

export function useMembersStore() {
    const store = useContext(MembersStoreContext);
    if (!store) throw new Error("No MembersStoreContext provided");
    return store;
}
