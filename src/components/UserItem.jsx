import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { MdOutlineMusicNote } from "react-icons/md";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "../components/ModeToggle";
const UserItem = (props) => {
  const { userData, playingTrack } = props;

  return (
    <Item
      variant="outline"
      className="max-w-md w-full h-fit items-center justify-between"
    >
      <ItemMedia>
        <Avatar>
          <AvatarImage src={userData?.images[0]?.url} />
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{userData?.display_name || "User"} </ItemTitle>
        <ItemDescription className="flex items-center gap-2">
          <MdOutlineMusicNote className="shrink-0" />
          <div className="marquee-container">
            <div className="marquee-content">
              <span className="marquee-text">
                {playingTrack?.item?.name || "Nothing"}
              </span>
              <span className="marquee-text">
                {playingTrack?.item?.name || "Nothing"}
              </span>
            </div>
          </div>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <ModeToggle />
      </ItemActions>
    </Item>
  );
};

export default UserItem;
