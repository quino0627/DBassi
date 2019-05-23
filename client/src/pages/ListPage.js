import React from "react";
import PageTemplate from "../components/common/PageTemplate";
import ListWrapper from "../components/list/ListWrapper";
import ListContainer from "../containers/list/ListContainer";
import SearchBar from "../components/common/SearchBar";
const ListPage = ({ match }) => {
  const { page = 1, tag, board_no } = match.params;
  console.log(match.params);
  console.log(page, board_no);
  return (
    <PageTemplate>
      <ListWrapper>
        <SearchBar />
        <ListContainer
          board_no={board_no}
          page={parseInt(page, 10)}
          tag={tag}
        />
      </ListWrapper>
    </PageTemplate>
  );
};

export default ListPage;
