// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract ERC721SBT is Context, ERC165, IERC721, IERC721Metadata {
    string private _name;
    string private _symbol;

    uint256 internal _nextTokenId = 0;

    mapping(uint256 => address) internal _owners;
    mapping(address => uint256) internal _balances;
    mapping(uint256 => string) internal _tokenURIs;

    error NonExistentToken();
    error SBTLocked();
    error InvalidAddress();

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, IERC165) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    // IERC721Metadata
    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert NonExistentToken();
        return _tokenURIs[tokenId];
    }

    // IERC721
    function balanceOf(address owner) public view returns (uint256) {
        if (owner == address(0)) revert InvalidAddress();
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) revert NonExistentToken();
        return owner;
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public pure virtual {
        revert SBTLocked();
    }

    function approve(address to, uint256 tokenId) public pure virtual {
        revert SBTLocked();
    }

    function setApprovalForAll(
        address operator,
        bool approved
    ) public pure virtual {
        revert SBTLocked();
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external virtual {
        revert SBTLocked();
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external virtual {
        revert SBTLocked();
    }

    function getApproved(
        uint256 tokenId
    ) external view virtual returns (address operator) {
        revert SBTLocked();
    }

    function isApprovedForAll(
        address owner,
        address operator
    ) external view virtual returns (bool) {
        revert SBTLocked();
    }
}
