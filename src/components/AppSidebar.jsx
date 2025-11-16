import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "@/components/ui/item";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserItem from "./UserItem";
import { GiMusicalNotes } from "react-icons/gi";
import { Button } from "./ui/button";
import { FaRegCirclePlay } from "react-icons/fa6";

export function AppSidebar(props) {
  const { setSelectedPlaylist, userData, playingTrack, userPlaylists } = props;

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <div className="flex items-center gap-2 font-semibold text-lg">
          <GiMusicalNotes />
          Music Guessing Game
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your playlists</SidebarGroupLabel>
          <ScrollArea className="h-72 w-full rounded-md border">
            {userPlaylists?.items.map((p) => {
              return (
                <Item key={p.id} variant="outline" className="m-0.5">
                  <ItemMedia>
                    <Avatar variant="square">
                      <AvatarImage src={p.images[0].url} />
                    </Avatar>
                  </ItemMedia>
                  <ItemContent> {p.name}</ItemContent>
                  <ItemActions>
                    <Button
                      onClick={() => setSelectedPlaylist(p)}
                      variant="outline"
                      size="icon"
                    >
                      <FaRegCirclePlay />
                    </Button>
                  </ItemActions>
                </Item>
              );
            })}
          </ScrollArea>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserItem userData={userData} playingTrack={playingTrack} />
      </SidebarFooter>
    </Sidebar>
  );
}
