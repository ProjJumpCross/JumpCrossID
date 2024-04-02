// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./ERC721SBT.sol";

contract JumpCrossID is ERC721SBT("JumpCrossID", "JCID") {
    address private _owner;
    uint256 public nameMaxLength = 32;
    uint256 public mintFee = 300000000000000;
    uint256 public wordFee = 300000000000000;
    uint256[3] public wordFeeTiers = [1, 10, 100];

    string private _defaultTokenURI;

    mapping(address => string) private _reverseNames;
    mapping(string => address) private _forwardNames;

    error OnlyOwnerExecutable();
    error InvalidUserName(uint256 input);
    error SBTAlreadyExists();
    error UserNameHasBeenTaken();
    error InssufficientFunds(uint256 needed, uint256 sent);
    error InvalidAmount();
    error InvalidTierIndex();

    event UpdateMintFee(uint256 indexed mintFee);
    event UpdateWordFee(uint256 indexed wordFee);
    event UpdateWordMultiplier(
        uint256 indexed tier,
        uint256 indexed wordMultiplier
    );

    constructor(address owner_, string memory defaultTokenURI_) {
        _owner = owner_;
        _defaultTokenURI = defaultTokenURI_;
    }

    modifier onlyOwner() {
        if (_msgSender() != _owner) revert OnlyOwnerExecutable();
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function forwardResolution(
        string memory _username
    ) public view returns (address) {
        return _forwardNames[_username];
    }

    function reverseResolution(
        address addr
    ) public view returns (string memory) {
        return _reverseNames[addr];
    }

    function isTakenName(string memory _username) public view returns (bool) {
        return _forwardNames[_username] != address(0);
    }

    function defaultTokenURI() public view returns (string memory) {
        return _defaultTokenURI;
    }

    function _setTokenMetadata(
        uint256 tokenId,
        string memory _username
    ) internal {
        address holder = _msgSender();
        _reverseNames[holder] = _username;
        _tokenURIs[tokenId] = _defaultTokenURI;
    }

    function calculateWordFee(
        string memory username
    ) public view returns (uint256) {
        bytes memory usernameBytes = bytes(username);
        uint256 totalWordFee;

        if (usernameBytes.length <= 2) {
            totalWordFee = wordFee * wordFeeTiers[2];
        } else if (usernameBytes.length <= 4) {
            totalWordFee = wordFee * wordFeeTiers[1];
        } else if (usernameBytes.length <= 5) {
            totalWordFee = wordFee * wordFeeTiers[0];
        }

        return totalWordFee;
    }

    function mint(address to, string memory username) public payable {
        bytes memory usernameBytes = bytes(username);

        if (usernameBytes.length == 0 || usernameBytes.length > nameMaxLength)
            revert InvalidUserName(usernameBytes.length);
        if (isTakenName(username)) revert UserNameHasBeenTaken();

        uint256 _wordFee = calculateWordFee(username);
        uint256 totalFee = mintFee + _wordFee;

        if (msg.value < totalFee)
            revert InssufficientFunds({needed: totalFee, sent: msg.value});
        if (to == address(0)) revert InvalidAddress();
        if (_balances[to] > 0) revert SBTAlreadyExists();

        _mint(to, username);
    }

    function _mint(address to, string memory username) internal {
        uint256 tokenId = _nextTokenId++;
        address holder = _msgSender();

        _setTokenMetadata(tokenId, username);

        _balances[to] += 1;
        _owners[tokenId] = to;
        _forwardNames[username] = holder;

        emit Transfer(address(0), to, tokenId);
    }

    function setMintFee(uint256 _mintFee) public onlyOwner {
        if (_mintFee == mintFee) revert InvalidAmount();
        mintFee = _mintFee;
        emit UpdateMintFee(mintFee);
    }

    function updateTokenURI(
        uint256 tokenId,
        string memory tokenURI_
    ) public onlyOwner {
        tokenURI(tokenId); // check if token exists, otherwise revert
        _tokenURIs[tokenId] = tokenURI_;
    }

    function setBaseWordFee(uint256 _wordFee) public onlyOwner {
        if (_wordFee == wordFee) revert InvalidAmount();
        wordFee = _wordFee;
        emit UpdateWordFee(wordFee);
    }

    function setWordFeeTier(uint256 tier, uint256 multiplier) public onlyOwner {
        if (tier > wordFeeTiers.length - 1) revert InvalidTierIndex();
        if (wordFeeTiers[tier] == multiplier) revert InvalidAmount();
        // There is no requirement that the value of a higher tier must be greater than the value of a lower tier.

        // Precheck for overflow
        uint256 totalworldFee = wordFee * multiplier;
        totalworldFee + mintFee;

        wordFeeTiers[tier] = multiplier;
        emit UpdateWordMultiplier(tier, multiplier);
    }

    function changeOwner(address owner_) public onlyOwner {
        if (owner_ == address(0)) revert InvalidAddress();
        if (owner_ == _owner) revert InvalidAddress();
        _owner = owner_;
    }

    function withdraw() public onlyOwner {
        payable(_owner).transfer(address(this).balance);
    }
}
