import { SingletonLoader, useApiClient } from "folke-service-helpers";
import { computed, action, makeObservable, observable } from "mobx";
import { User, UserPatch, GalleryMember } from "../services/views";
import { UserController } from "../services/user";
import { createContext, useContext, useMemo } from "react";

export class UsersStore {
    memberships: GalleryMember[] | null = null;
    loadingMemberships = false;

    constructor(
        private meLoader: SingletonLoader<User>,
        public usersLoader: SingletonLoader<User[]>,
        private userService: UserController
    ) {
        makeObservable(this, {
            memberships: observable.ref,
            loadingMemberships: observable,
            me: computed,
            patch: action,
            users: computed,
            administrator: computed,
        });
    }

    get users() {
        return this.usersLoader.getValue() || [];
    }

    get me() {
        return this.meLoader.getValue();
    }

    get administrator() {
        return this.me?.administrator || false;
    }

    patch(user: User, patch: UserPatch) {
        if (patch.administrator !== undefined) {
            user.administrator = patch.administrator;
        }

        this.userService.patch(user.id, patch);
    }
}

const UsersStoreContext = createContext<UsersStore | null>(null);

export function UsersStoreProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const apiClient = useApiClient();
    const store = useMemo(() => {
        const userService = new UserController(apiClient);
        return new UsersStore(
            new SingletonLoader(() => userService.getMe()),
            new SingletonLoader(() => userService.getAll()),
            userService
        );
    }, [apiClient]);
    return (
        <UsersStoreContext.Provider value={store}>
            {children}
        </UsersStoreContext.Provider>
    );
}

export function useUsersStore() {
    const store = useContext(UsersStoreContext);
    if (!store) throw new Error("No UsersStoreContext provided");
    return store;
}
