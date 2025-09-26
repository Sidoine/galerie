import { useApiClient, ValueLoader } from "folke-service-helpers";
import { action, computed, makeObservable, observable } from "mobx";
import { User, GalleryMember } from "../services/views";
import { createContext, useContext, useMemo } from "react";
import { useDirectoriesStore } from "./directories";
import { GalleryMemberController } from "@/services/galleryMember";
import { MeStore, useMeStore } from "./me";

class MembersStore {
  memberships: GalleryMember[] | null = null;
  loadingMemberships = false;

  constructor(
    private galleryMemberService: GalleryMemberController,
    public galleryId: number,
    public membersLoader: ValueLoader<GalleryMember[], [number]>,
    private meStore: MeStore
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
    return this.members.find((x) => x.userId === this.meStore.me?.id);
  }

  get administrator() {
    return this.member?.isAdministrator || false;
  }

  async setMembershipAdmin(membership: GalleryMember, isAdmin: boolean) {
    membership.isAdministrator = isAdmin;
    await this.galleryMemberService.updateUserGalleryMembership(
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
    await this.galleryMemberService.updateUserGalleryMembership(
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
    const created = await this.galleryMemberService.addUserToGallery(
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
  const meStore = useMeStore();
  const store = useMemo(() => {
    const galleryMemberService = new GalleryMemberController(apiClient);
    const galleryMembersLoader = new ValueLoader(
      galleryMemberService.getGalleryMembers
    );
    return new MembersStore(
      galleryMemberService,
      galleryId,
      galleryMembersLoader,
      meStore
    );
  }, [apiClient, galleryId, meStore]);
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
