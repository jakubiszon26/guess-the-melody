import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../components/ui/item";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";

import { Avatar, AvatarImage } from "../components/ui/avatar";
import { ModeToggle } from "../components/ModeToggle";
const GameDashboard = (props) => {
  const { userData, playingTrack } = props;
  return (
    <div className="flex w-full min-h-screen p-4 justify-between items-start">
      <Item
        variant="outline"
        className="max-w-md w-full h-fit items-center justify-between"
      >
        <ItemMedia>
          <Avatar>
            <AvatarImage src={userData?.images[0].url} />
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Welcome! {userData?.display_name || "User"} </ItemTitle>
          <ItemDescription>
            Currently Playing: {playingTrack?.item?.name || "Nothing"}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ModeToggle />
        </ItemActions>
      </Item>
    </div>
  );
};

export default GameDashboard;
